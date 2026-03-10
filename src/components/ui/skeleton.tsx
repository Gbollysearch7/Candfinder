import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "rounded-md bg-gradient-to-r from-[#1e1e20] via-[#2a2a2d] to-[#1e1e20] bg-[length:200%_100%] animate-[shimmer_2s_linear_infinite]",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
