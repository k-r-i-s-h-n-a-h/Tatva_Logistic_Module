import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { LoginScreen } from "./LoginScreen"
import { X } from "lucide-react"

export function LoginModal({ 
  isOpen, 
  onClose, 
  initialIntent = 'login' 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  initialIntent?: 'login' | 'register' 
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[420px] p-0 border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-none gap-0 overflow-hidden">

        {/* Required for accessibility — hidden visually */}
        <VisuallyHidden>
          <DialogTitle>
            {initialIntent === 'login' ? 'Login' : 'Create Account'}
          </DialogTitle>
        </VisuallyHidden>

        {/* Header */}
        <div className="bg-black text-white px-6 py-5 flex items-start justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-yellow-400 mb-1">
              TatvaConnect
            </p>
            <h2 className="text-xl font-black uppercase leading-tight">
              {initialIntent === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">
              {initialIntent === 'login' 
                ? 'Log in to access your shipments and quotes' 
                : 'Join to access AI-powered logistics optimization'}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors mt-1 ml-4"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 bg-white">
          <LoginScreen isModal={true} onClose={onClose} initialIntent={initialIntent} />
        </div>

      </DialogContent>
    </Dialog>
  );
}