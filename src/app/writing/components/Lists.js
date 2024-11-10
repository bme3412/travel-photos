import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { lists } from './listsData';

const Lists = () => {
  return (
    <div className="space-y-6">
      {lists.map((list) => (
        <Link 
          href={`/writing/lists/${list.slug}`} 
          key={list.slug}
          className="block group relative"
        >
          <div 
            className="
              absolute inset-0 bg-gradient-to-r from-teal-50 to-transparent 
              opacity-0 group-hover:opacity-100 rounded-lg transition-opacity duration-300
            "
          />
          <div 
            className="
              relative p-4 rounded-lg
              transition-all duration-300 ease-in-out
              hover:translate-x-1
            "
          >
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-lg font-medium text-gray-900 group-hover:text-teal-600 transition-colors">
                {list.title}
              </h3>
              <ArrowRight 
                className="
                  h-5 w-5 text-gray-300 
                  transform transition-all duration-300 
                  group-hover:text-teal-600 group-hover:translate-x-1
                  opacity-0 group-hover:opacity-100
                " 
              />
            </div>
            
            <p className="
              text-gray-500 mt-1.5 
              transition-colors duration-300
              group-hover:text-gray-600
              pr-8
            ">
              {list.description}
            </p>

            {/* Hover line */}
            <div className="
              absolute bottom-0 left-0 
              h-[1px] bg-gradient-to-r from-teal-500/50 to-transparent
              w-0 group-hover:w-full 
              transition-all duration-300 ease-out
            " />
          </div>
        </Link>
      ))}
    </div>
  );
};

export default Lists;