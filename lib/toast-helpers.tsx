import { useToast } from '@/hooks/use-toast'

export function useEnhancedToast() {
  const { toast } = useToast()

  return {
    success: (message: string, description?: string) => {
      toast({
        title: message,
        description,
        variant: 'default',
        className: 'border-green-200 bg-green-50 text-green-900',
      })
    },

    error: (message: string, description?: string) => {
      toast({
        title: message,
        description,
        variant: 'destructive',
      })
    },

    warning: (message: string, description?: string) => {
      toast({
        title: message,
        description,
        className: 'border-amber-200 bg-amber-50 text-amber-900',
      })
    },

    info: (message: string, description?: string) => {
      toast({
        title: message,
        description,
        className: 'border-blue-200 bg-blue-50 text-blue-900',
      })
    },

    loading: (message: string) => {
      return toast({
        title: message,
        description: (
          <div className="flex items-center gap-2">
            <div className="animate-spin h-4 w-4 border-2 border-slate-900 border-t-transparent rounded-full" />
            <span>Please wait...</span>
          </div>
        ),
        duration: Infinity,
      })
    },

    promise: async <T,>(
      promise: Promise<T>,
      messages: {
        loading: string
        success: string
        error: string
      }
    ) => {
      const loadingToast = toast({
        title: messages.loading,
        duration: Infinity,
      })

      try {
        const result = await promise
        loadingToast.dismiss()
        toast({
          title: messages.success,
          variant: 'default',
          className: 'border-green-200 bg-green-50 text-green-900',
        })
        return result
      } catch (error) {
        loadingToast.dismiss()
        toast({
          title: messages.error,
          description: error instanceof Error ? error.message : 'Unknown error',
          variant: 'destructive',
        })
        throw error
      }
    }
  }
}

