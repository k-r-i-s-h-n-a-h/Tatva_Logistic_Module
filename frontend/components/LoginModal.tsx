// frontend/components/LoginModal.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { LoginScreen } from "./LoginScreen" 


export function LoginModal({ isOpen, onClose, initialIntent = 'login' }: { isOpen: boolean, onClose: () => void, initialIntent?: 'login' | 'register' }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] border-4 border-black p-0 overflow-hidden">
        
        <DialogHeader className="bg-yellow-400 p-4 border-b-4 border-black m-0 space-y-0 text-left">
          <DialogTitle className="font-black uppercase text-sm">
            {initialIntent === 'login' ? 'Welcome Back' : 'Create Account'}
          </DialogTitle>
          <p className="text-[10px] font-bold mt-1 text-black">
            {initialIntent === 'login' ? 'Please log in to continue' : 'Join TatvaOps to access AI Optimization'}
          </p>
        </DialogHeader>

        <div className="p-6">
          <LoginScreen isModal={true} onClose={onClose} initialIntent={initialIntent} /> 
        </div>
        
      </DialogContent>
    </Dialog>
  )
}