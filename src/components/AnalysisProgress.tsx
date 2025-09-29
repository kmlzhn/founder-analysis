import { motion, AnimatePresence } from 'framer-motion';

interface AnalysisProgressProps {
  stage: string;
}

export default function AnalysisProgress({ stage }: AnalysisProgressProps) {
  return (
    <div className="py-6 bg-white">
      <div className="max-w-3xl mx-auto px-4">
        {/* Smooth text transition */}
        <AnimatePresence mode="wait">
          <motion.span
            key={stage}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="text-sm font-medium text-gray-700"
          >
            {stage}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
}
