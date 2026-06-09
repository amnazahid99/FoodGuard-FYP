import { useState, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const AccordionContext = createContext({ openItem: null, setOpenItem: () => {} });
const AccordionValueContext = createContext(null);

export function Accordion({ type = 'single', children, className = '', style }) {
  const [openItem, setOpenItem] = useState(null);
  return (
    <AccordionContext.Provider value={{ openItem, setOpenItem }}>
      <div className={className} style={style}>{children}</div>
    </AccordionContext.Provider>
  );
}

export function AccordionItem({ value, children, className = '', style }) {
  return (
    <AccordionValueContext.Provider value={value}>
      <div data-value={value} className={className} style={style}>{children}</div>
    </AccordionValueContext.Provider>
  );
}

export function AccordionTrigger({ children, className = '', style }) {
  const { openItem, setOpenItem } = useContext(AccordionContext);
  const value = useContext(AccordionValueContext);
  const isOpen = openItem === value;

  return (
    <button
      onClick={() => setOpenItem(isOpen ? null : value)}
      className={`w-full flex items-center justify-between text-left ${className}`}
      style={style}
    >
      {children}
      <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
        <ChevronDown className="w-4 h-4 flex-shrink-0" />
      </motion.div>
    </button>
  );
}

export function AccordionContent({ children, className = '', style }) {
  const { openItem } = useContext(AccordionContext);
  const value = useContext(AccordionValueContext);
  const isOpen = openItem === value;

  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className="overflow-hidden"
        >
          <div className={className} style={style}>{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
