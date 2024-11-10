'use client';

import React from 'react';
import { BookOpen, ListChecks, Globe } from 'lucide-react';
import Essays from './components/Essays';
import Lists from './components/Lists';
import BucketList from './components/BucketList';

const WritingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Essays Section */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-teal-500/5 rounded-xl blur-xl transition-all duration-300 group-hover:blur-2xl" />
            <section className="relative bg-white/80 backdrop-blur-sm rounded-xl overflow-hidden">
              <div className="p-8">
                <div className="flex items-center gap-3 mb-8">
                  <BookOpen className="h-5 w-5 text-teal-600" />
                  <h2 className="text-xl font-bold text-gray-900">Essays</h2>
                </div>
                <div className="space-y-6">
                  <Essays />
                </div>
              </div>
            </section>
          </div>

          {/* Lists Section */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-teal-500/5 rounded-xl blur-xl transition-all duration-300 group-hover:blur-2xl" />
            <section className="relative bg-white/80 backdrop-blur-sm rounded-xl overflow-hidden">
              <div className="p-8">
                <div className="flex items-center gap-3 mb-8">
                  <ListChecks className="h-5 w-5 text-teal-600" />
                  <h2 className="text-xl font-bold text-gray-900">Travel Lists</h2>
                </div>
                <div className="space-y-6">
                  <Lists />
                </div>
              </div>
            </section>
          </div>

          {/* Bucket List Section */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-teal-500/5 rounded-xl blur-xl transition-all duration-300 group-hover:blur-2xl" />
            <section className="relative bg-white/80 backdrop-blur-sm rounded-xl overflow-hidden">
              <div className="p-8">
                <div className="flex items-center gap-3 mb-8">
                  <Globe className="h-5 w-5 text-teal-600" />
                  <h2 className="text-xl font-bold text-gray-900">Bucket List</h2>
                </div>
                <div className="space-y-6">
                  <BucketList />
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Background Elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-teal-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default WritingPage;