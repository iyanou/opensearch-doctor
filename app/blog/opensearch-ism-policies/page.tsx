import { ArticleLayout } from "@/components/blog/article-layout";
import { getPost } from "@/lib/blog";

const post = getPost("opensearch-ism-policies")!;

export const metadata = {
  title: `${post.title} — OpenSearch Doctor Blog`,
  description: post.description,
};

export default function Article() {
  return (
    <ArticleLayout {...post}>

      <p>
        Index State Management is how most OpenSearch operators handle index lifecycle — rolling over time-series indices when they get too large, moving older data to cheaper storage tiers, deleting indices past their retention window. When it works, it&apos;s invisible. When it breaks, it breaks silently: indices accumulate, disk fills up, and eventually the cluster hits a watermark and puts everything into read-only mode.
      </p>
      <p>
        This post covers the most common ISM mistakes, how to diagnose failures, and how to build policies that actually work reliably.
      </p>

      <h2>A Quick ISM Primer</h2>
      <p>
        An ISM policy is a state machine. You define states (e.g. &quot;hot&quot;, &quot;warm&quot;, &quot;delete&quot;), the conditions that trigger transitions between states (e.g. &quot;index is older than 30 days&quot; or &quot;index is larger than 50 GB&quot;), and the actions to take when transitioning (e.g. force-merge, replica change, delete). OpenSearch runs the ISM job every 5 minutes (by default) and advances each managed index through its policy.
      </p>
      <p>
        The key concepts you need to understand before writing policies:
      </p>
      <ul>
        <li><strong>Rollover</strong>: Creates a new write index and makes the current index read-only. Requires a <em>rollover alias</em> configured on the index. The rollover action only triggers on the index currently pointed to by the write alias.</li>
        <li><strong>Alias</strong>: A named pointer to one or more indices. For rollover to work, the managed index must have a rollover alias configured, and the alias must point to it as the write index.</li>
        <li><strong>State</strong>: Where the index currently is in the policy. An index can only be in one state at a time.</li>
        <li><strong>Transition condition</strong>: The condition that must be true for the index to move to the next state. OpenSearch checks these on every ISM run (every 5 minutes).</li>
      </ul>

      <h2>Mistake 1: Rollover Without a Write Alias</h2>
      <p>
        This is the single most common ISM misconfiguration. You apply a rollover policy to an index, the ISM job runs, checks the rollover condition (e.g. index is &gt; 50 GB or &gt; 7 days old), and... nothing happens. The index stays in its current state indefinitely.
      </p>
      <p>
        Why: the rollover action only works on an index that is the current write target of a rollover alias. If the index doesn&apos;t have that alias configured, the rollover silently no-ops.
      </p>
      <p>
        <strong>How to diagnose:</strong>
      </p>
      <pre><code>{`# Check ISM state for an index
GET /_plugins/_ism/explain/my-index-000001
# Look for: info.cause — if it mentions "not the write index of any alias",
# that's the problem.

# Check what aliases the index has
GET /my-index-000001/_alias`}</code></pre>
      <p>
        <strong>How to fix:</strong>
      </p>
      <pre><code>{`# Step 1: Create the alias pointing to the current index as write index
POST /_aliases
{
  "actions": [
    {
      "add": {
        "index": "my-index-000001",
        "alias": "my-index",
        "is_write_index": true
      }
    }
  ]
}

# Step 2: Make sure the policy references this alias
# In your policy's rollover action, set:
# "rollover": { "min_size": "50gb" }
# And in the index settings, set:
# "plugins.index_state_management.rollover_alias": "my-index"`}</code></pre>

      <h2>Mistake 2: Conditions That Can Never Be Met</h2>
      <p>
        A transition condition that is logically impossible will leave an index stuck in its current state forever. Common examples:
      </p>
      <ul>
        <li><code>min_doc_count: 1000000</code> on an index that only ever receives a few thousand documents per day — the index will grow forever but never roll over</li>
        <li><code>min_size: "100gb"</code> when your data volume is 2 GB/day — a 50-day-old index at full capacity, still not rolling over</li>
        <li>Multiple conditions on a transition with implicit AND logic — you need <em>all</em> conditions to be true simultaneously</li>
      </ul>
      <p>
        Note that rollover transition conditions use OR logic by default in newer OpenSearch versions — the rollover triggers if <em>any</em> condition is met. But ISM <em>state transition</em> conditions for moving between non-rollover states use AND. This distinction trips people up.
      </p>
      <p>
        <strong>Best practice:</strong> For time-series data, define rollover conditions that will realistically be met on your expected data volume. Use both a size condition and an age condition so you have a safety net:
      </p>
      <pre><code>{`{
  "rollover": {
    "min_size": "30gb",
    "min_index_age": "7d"
  }
}`}</code></pre>
      <p>
        This rolls over when the index reaches 30 GB OR when it&apos;s 7 days old, whichever comes first.
      </p>

      <h2>Mistake 3: Applying Policies to the Wrong Indices</h2>
      <p>
        ISM policies are applied to indices via an <code>ism_template</code> — a pattern that matches index names. A poorly scoped pattern can silently apply your rollover-and-delete policy to system indices or other indices that shouldn&apos;t be managed.
      </p>
      <pre><code>{`# Dangerous — matches everything
{
  "ism_template": [{ "index_patterns": ["*"], "priority": 1 }]
}

# Better — explicit prefix
{
  "ism_template": [{ "index_patterns": ["logs-*", "metrics-*"], "priority": 100 }]
}`}</code></pre>
      <p>
        Also check: when you update an ISM policy, it does <em>not</em> automatically re-apply to already-managed indices. Indices that were already attached to the old policy version continue with the old version unless you explicitly update them.
      </p>
      <pre><code>{`# Update all indices using a policy to the latest version
POST /_plugins/_ism/change_policy/my-index-*
{
  "policy_id": "my-policy",
  "state": "hot"
}`}</code></pre>

      <h2>Mistake 4: Deleting Indices Whose Aliases Are Still Referenced</h2>
      <p>
        When ISM deletes an old index, it doesn&apos;t clean up aliases. If you have a search alias pointing to a range of indices (e.g. <code>logs-search</code> → <code>logs-000001</code> through <code>logs-000045</code>) and ISM deletes <code>logs-000001</code>, the alias still has a pointer to a non-existent index. Searches against that alias will return errors.
      </p>
      <p>
        <strong>How to check:</strong>
      </p>
      <pre><code>{`# Find aliases pointing to non-existent indices
GET /_cat/aliases?v
# Cross-reference with:
GET /_cat/indices?v`}</code></pre>
      <p>
        <strong>The fix:</strong> Either remove the alias before deletion (add an <code>alias_action</code> to your ISM policy before the delete state), or use index patterns in your alias that only match existing indices.
      </p>

      <h2>Mistake 5: Not Checking ISM Error State</h2>
      <p>
        When ISM fails to execute an action (e.g. rollover fails because of no write alias, or force-merge fails because the node is under disk pressure), the index moves into an <strong>error state</strong>. It stays there until you manually retry. OpenSearch does not retry ISM actions automatically on failure.
      </p>
      <p>
        Many teams don&apos;t check this. Indices accumulate in error state for weeks until disk fills.
      </p>
      <p>
        <strong>How to check:</strong>
      </p>
      <pre><code>{`# Check ISM state for all managed indices
GET /_plugins/_ism/explain/*

# Filter for indices in error state using a script, or:
# Look for indices where info.cause is non-empty — that's an error`}</code></pre>
      <p>
        <strong>How to fix:</strong> Resolve the root cause, then retry:
      </p>
      <pre><code>{`# Retry ISM for a specific index
POST /_plugins/_ism/retry/my-index-000001

# Retry for multiple indices
POST /_plugins/_ism/retry/my-index-*`}</code></pre>

      <h2>Mistake 6: Priority Conflicts Between Policies</h2>
      <p>
        If you have multiple ISM policies with overlapping <code>ism_template</code> patterns, OpenSearch uses the priority field to decide which policy applies. If priorities are equal, the behavior is undefined — OpenSearch may pick either policy, and it may change between runs.
      </p>
      <pre><code>{`# Always set explicit, distinct priorities
{
  "ism_template": [{ "index_patterns": ["logs-*"], "priority": 100 }]
}
{
  "ism_template": [{ "index_patterns": ["logs-archive-*"], "priority": 200 }]
  # Higher priority = takes precedence when patterns overlap
}`}</code></pre>

      <h2>Debugging ISM: The Full Toolkit</h2>
      <pre><code>{`# 1. Explain a specific index — most useful first step
GET /_plugins/_ism/explain/my-index-000001

# 2. Explain all managed indices — find errors at scale
GET /_plugins/_ism/explain/*

# 3. Check the ISM job execution interval
GET /_cluster/settings?include_defaults=true
# Look for: plugins.index_state_management.job_interval (default: 5 minutes)

# 4. Get all policies
GET /_plugins/_ism/policies

# 5. Get which policy an index is using
GET /my-index-000001/_settings
# Look for: index.plugins.index_state_management.policy_id

# 6. Manually move an index to a different state (use with care)
POST /_plugins/_ism/explain/my-index-000001
# Then force a state change:
POST /_plugins/_ism/change_policy/my-index-000001
{
  "policy_id": "my-policy",
  "state": "warm"
}`}</code></pre>

      <h2>A Minimal Policy That Actually Works</h2>
      <p>
        Here&apos;s a battle-tested rollover-and-delete policy for time-series logs:
      </p>
      <pre><code>{`PUT /_plugins/_ism/policies/logs-lifecycle
{
  "policy": {
    "description": "Roll over logs at 30GB or 7 days. Delete after 30 days.",
    "ism_template": [{
      "index_patterns": ["logs-*"],
      "priority": 100
    }],
    "default_state": "hot",
    "states": [
      {
        "name": "hot",
        "actions": [],
        "transitions": [
          {
            "state_name": "rollover",
            "conditions": {
              "min_size": "30gb",
              "min_index_age": "7d"
            }
          }
        ]
      },
      {
        "name": "rollover",
        "actions": [
          {
            "rollover": {
              "min_size": "30gb",
              "min_index_age": "7d"
            }
          }
        ],
        "transitions": [
          {
            "state_name": "warm"
          }
        ]
      },
      {
        "name": "warm",
        "actions": [
          {
            "replica_count": {
              "number_of_replicas": 1
            }
          },
          {
            "force_merge": {
              "max_num_segments": 1
            }
          }
        ],
        "transitions": [
          {
            "state_name": "delete",
            "conditions": {
              "min_index_age": "30d"
            }
          }
        ]
      },
      {
        "name": "delete",
        "actions": [
          { "delete": {} }
        ],
        "transitions": []
      }
    ]
  }
}`}</code></pre>
      <p>
        Before applying this policy to existing indices, make sure each index has a rollover alias configured with <code>is_write_index: true</code>. For new indices, create them through the alias from the start:
      </p>
      <pre><code>{`# Create first index with alias
PUT /logs-000001
{
  "aliases": {
    "logs": {
      "is_write_index": true
    }
  },
  "settings": {
    "plugins.index_state_management.rollover_alias": "logs"
  }
}

# All writes go to the alias — ISM handles rollover automatically`}</code></pre>

      <h2>Monitoring ISM Health</h2>
      <p>
        The only reliable way to catch ISM errors before they cause disk problems is to check ISM state regularly and alert when any index is in an error state. There&apos;s no built-in alerting for ISM failures in OpenSearch itself — you need to either build a script that polls <code>GET /_plugins/_ism/explain/*</code> or use a tool that does this automatically.
      </p>
      <p>
        ISM error detection is one of the core checks in OpenSearch Doctor. It polls all managed indices on every diagnostic run, surfaces indices in error state as findings, shows the specific error message, and includes the retry command. It&apos;s the kind of check that&apos;s too tedious to do manually but too important to skip.
      </p>

    </ArticleLayout>
  );
}
