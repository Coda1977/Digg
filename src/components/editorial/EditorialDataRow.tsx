import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { EditorialLabel } from "./EditorialLabel";

interface EditorialDataRowProps {
    status?: ReactNode;
    title: string;
    meta?: ReactNode;
    actions?: ReactNode;
    onClick?: () => void;
    className?: string;
}

export function EditorialDataRow({
    status,
    title,
    meta,
    actions,
    onClick,
    className,
}: EditorialDataRowProps) {
    return (
        <article
            className={cn(
                "group flex flex-col sm:flex-row sm:items-baseline gap-4 py-4 px-4 -mx-4 transition-all hover:bg-ink/5 hover:pl-5 cursor-pointer border-b border-ink/10 last:border-b-0",
                className
            )}
            onClick={onClick}
        >
            {/* Main Content Column */}
            <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    <h3 className="font-serif font-bold text-xl leading-tight text-ink group-hover:text-ink">
                        {title}
                    </h3>
                    {/* Status inline on both mobile and desktop */}
                    {status && (
                        <div className="flex-shrink-0">
                            {typeof status === "string" ? (
                                <EditorialLabel className="text-xs">{status}</EditorialLabel>
                            ) : (
                                status
                            )}
                        </div>
                    )}
                </div>

                {meta && (
                    <div className="text-body text-ink-soft flex flex-wrap items-center gap-x-4 gap-y-1">
                        {meta}
                    </div>
                )}
            </div>

            {/* Actions Column */}
            {actions && (
                <div className="flex-shrink-0 flex items-center gap-2 pt-2 sm:pt-0">
                    {actions}
                </div>
            )}
        </article>
    );
}
