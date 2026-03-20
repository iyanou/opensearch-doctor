interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-3 px-4 md:px-6 py-4 md:py-5 border-b border-border/60 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="min-w-0">
        <h1 className="text-lg md:text-xl font-bold tracking-tight truncate">{title}</h1>
        {description && (
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5 truncate">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
