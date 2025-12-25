import Link from "next/link";
import { ChevronRight, MoreHorizontal } from "lucide-react";
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
    // For mobile: show first, ellipsis for middle, and last
    // For desktop: show all items
    const shouldTruncate = items.length > 3;

    return (
        <nav aria-label="Breadcrumb" className={cn("flex items-center", className)}>
            {/* Desktop: Show all items */}
            <ol className="hidden sm:flex flex-wrap items-center gap-2 text-[14px] font-medium uppercase tracking-label">
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

            {/* Mobile: Truncate middle items if more than 3 */}
            <ol className="flex sm:hidden flex-wrap items-center gap-2 text-label font-medium uppercase tracking-label">
                {shouldTruncate ? (
                    <>
                        {/* First item */}
                        <li className="flex items-center gap-2">
                            {items[0].href ? (
                                <Link
                                    href={items[0].href}
                                    className="text-ink-soft hover:text-ink transition-colors"
                                >
                                    {items[0].label}
                                </Link>
                            ) : (
                                <span className="text-ink">{items[0].label}</span>
                            )}
                        </li>

                        {/* Ellipsis for middle items */}
                        <li className="flex items-center gap-2">
                            <ChevronRight
                                className="h-3 w-3 text-ink-lighter flex-shrink-0"
                                aria-hidden="true"
                            />
                            <MoreHorizontal
                                className="h-4 w-4 text-ink-lighter"
                                aria-label={`${items.length - 2} more items`}
                            />
                        </li>

                        {/* Last item */}
                        <li className="flex items-center gap-2">
                            <ChevronRight
                                className="h-3 w-3 text-ink-lighter flex-shrink-0"
                                aria-hidden="true"
                            />
                            <span
                                className="text-ink font-bold truncate max-w-[150px]"
                                aria-current="page"
                            >
                                {items[items.length - 1].label}
                            </span>
                        </li>
                    </>
                ) : (
                    // Show all items if 3 or fewer
                    items.map((item, index) => {
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
                                            isLast && "font-bold truncate max-w-[150px]"
                                        )}
                                        aria-current={isLast ? "page" : undefined}
                                    >
                                        {item.label}
                                    </span>
                                )}
                            </li>
                        );
                    })
                )}
            </ol>
        </nav>
    );
}
