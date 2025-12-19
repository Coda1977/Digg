import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface EditorialBreadcrumbsProps {
    items: BreadcrumbItem[];
    className?: string;
}

export function EditorialBreadcrumbs({
    items,
    className,
}: EditorialBreadcrumbsProps) {
    return (
        <nav aria-label="Breadcrumb" className={cn("flex items-center", className)}>
            <ol className="flex flex-wrap items-center gap-2 text-label font-medium uppercase tracking-label">
                {items.map((item, index) => {
                    const isLast = index === items.length - 1;

                    return (
                        <li key={index} className="flex items-center gap-2">
                            {index > 0 && (
                                <ChevronRight
                                    className="h-3 w-3 text-ink-lighter flex-shrink-0"
                                    aria-hidden="true"
                                />
                            )}
                            {item.href && !isLast ? (
                                <Link
                                    href={item.href}
                                    className="text-ink-soft hover:text-ink transition-colors"
                                >
                                    {item.label}
                                </Link>
                            ) : (
                                <span
                                    className={cn(
                                        "text-ink",
                                        isLast && "font-bold"
                                    )}
                                    aria-current={isLast ? "page" : undefined}
                                >
                                    {item.label}
                                </span>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
