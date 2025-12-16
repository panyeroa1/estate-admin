import React, { useState } from 'react';
import { Phone, X, User } from 'lucide-react';

const CallWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const contacts = [
    {
      name: "Beatrice",
      role: "Inbound & Outbound",
      number: "+1 (844) 484 9501",
      tel: "+18444849501"
    },
    {
      name: "Stephen",
      role: "Inbound & Outbound",
      number: "+1 (844) 484 9450",
      tel: "+18444849450"
    }
  ];

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end font-sans">
      {isOpen && (
        <div className="mb-4 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-200">
          <div className="bg-blue-600 p-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white opacity-5 rounded-full -mr-8 -mt-8"></div>
            <h3 className="text-white font-bold text-base relative z-10">Agent & Property Mngt</h3>
            <p className="text-blue-100 text-xs mt-1 relative z-10">Direct Support Lines</p>
          </div>
          
          <div className="p-2 space-y-1">
            {contacts.map((contact, idx) => (
              <div key={idx} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition-colors group">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <User size={18} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="font-semibold text-gray-900 dark:text-white text-sm">{contact.name}</p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">{contact.role}</p>
                        </div>
                    </div>
                    <a 
                        href={`tel:${contact.tel}`} 
                        className="mt-2 flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-sm hover:underline"
                    >
                        <Phone size={14} className="fill-current" />
                        {contact.number}
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-900/50 p-3 text-center border-t border-gray-100 dark:border-gray-700">
            <p className="text-[10px] text-gray-400">Available during business hours</p>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          h-14 w-14 rounded-full shadow-lg shadow-blue-500/20 flex items-center justify-center transition-all duration-300 transform hover:scale-110 active:scale-95
          ${isOpen 
            ? 'bg-gray-800 dark:bg-gray-700 text-white rotate-90' 
            : 'bg-blue-600 text-white hover:bg-blue-700'
          }
        `}
      >
        {isOpen ? <X size={24} /> : <Phone size={24} className="animate-pulse" />}
      </button>
    </div>
  );
};

export default CallWidget;