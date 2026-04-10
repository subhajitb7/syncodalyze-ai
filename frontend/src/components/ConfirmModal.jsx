import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiAlertTriangle, FiX } from 'react-icons/fi';

/**
 * ConfirmModal - A premium, reusable confirmation dialog.
 */
const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Are you sure?", 
  message = "This action cannot be undone.",
  confirmText = "Delete Permanently",
  cancelText = "Cancel",
  type = "danger" // danger, warning, info
}) => {
  if (!isOpen) return null;

  const typeConfig = {
    danger: {
      icon: <FiAlertTriangle className="text-red-500 w-12 h-12 mb-4" />,
      confirmBtn: "bg-red-500/20 text-red-500 border-red-500/50 hover:bg-red-500 hover:text-white"
    },
    warning: {
      icon: <FiAlertTriangle className="text-amber-500 w-12 h-12 mb-4" />,
      confirmBtn: "bg-amber-500/20 text-amber-500 border-amber-500/50 hover:bg-amber-500 hover:text-white"
    }
  };

  const config = typeConfig[type] || typeConfig.danger;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative w-full max-w-md bg-sec border border-col rounded-2xl p-8 shadow-2xl overflow-hidden"
          >
            {/* Glossy overlay effect */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-primary-500/5 blur-[80px] rounded-full pointer-events-none" />
            
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-sec hover:text-main hover:bg-ter rounded-lg transition-all"
            >
              <FiX className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center">
              {config.icon}
              <h2 className="text-2xl font-bold text-main mb-2 tracking-tight">{title}</h2>
              <p className="text-sec mb-8 leading-relaxed max-w-[280px]">
                {message}
              </p>

              <div className="flex flex-col sm:flex-row gap-3 w-full mt-2">
                <button 
                  onClick={onClose}
                  className="btn-secondary flex-1 h-12 text-sm font-bold"
                >
                  {cancelText}
                </button>
                <button 
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={`flex-1 px-6 h-12 rounded-xl text-sm font-bold border transition-all ${config.confirmBtn}`}
                >
                  {confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmModal;
