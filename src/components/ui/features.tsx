"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface FeaturesProps {
  features: {
    id: number;
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
  }[];
  badgeText?: string;
  title?: string;
}

export function Features({
  features,
  badgeText = "Payment SDK Flow",
  title = "Merchant & User Journey",
}: FeaturesProps) {
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);

  return (
    <div className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-sky-500 font-semibold text-sm uppercase tracking-wider">
            {badgeText}
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-black dark:text-white mt-4 mb-6">
            {title}
          </h2>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 to-purple-500 transform md:-translate-x-px"></div>

          <div className="space-y-12">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              const isEven = index % 2 === 0;
              const isHovered = hoveredStep === index;

              return (
                <motion.div
                  key={feature.id}
                  className={`relative flex items-center ${
                    isEven ? "md:flex-row" : "md:flex-row-reverse"
                  } flex-col md:gap-8`}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  onMouseEnter={() => setHoveredStep(index)}
                  onMouseLeave={() => setHoveredStep(null)}
                >
                  {/* Timeline Node */}
                  <div className="relative z-10 flex items-center justify-center w-16 h-16 bg-white dark:bg-slate-800 rounded-full border-4 border-blue-500 shadow-lg">
                    <Icon className={`w-6 h-6 transition-colors duration-300 ${
                      isHovered
                        ? "text-blue-500"
                        : "text-slate-600 dark:text-slate-400"
                    }`} />
                  </div>

                  {/* Content Card */}
                  <motion.div
                    className={`flex-1 max-w-md ${
                      isEven ? "md:text-right" : "md:text-left"
                    } text-center md:text-left`}
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <div
                      className={`bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 transition-all duration-300 ${
                        isHovered
                          ? "shadow-2xl border-blue-300 dark:border-blue-600"
                          : ""
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-300 ${
                            isHovered
                              ? "bg-blue-100 dark:bg-blue-900/30"
                              : "bg-slate-100 dark:bg-slate-700"
                          }`}
                        >
                          <Icon className={`w-4 h-4 transition-colors duration-300 ${
                            isHovered
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-slate-600 dark:text-slate-400"
                          }`} />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                          {feature.title}
                        </h3>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                        {feature.description}
                      </p>

                      {/* Step Number */}
                      <div className="mt-4 flex items-center justify-center md:justify-start">
                        <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-500 text-white text-xs font-bold rounded-full">
                          {index + 1}
                        </span>
                      </div>
                    </div>
                  </motion.div>

                  {/* Spacer for alignment */}
                  <div className="hidden md:block flex-1"></div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
