// src/app/writing/components/Essays.js

import React from 'react';

const Essays = () => {
  const essays = [
    {
      title: 'The Journey to the Mountains',
      content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit...',
    },
    {
      title: 'Exploring the Hidden Beaches',
      content: 'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua...',
    },
    // Add more essays as needed
  ];

  return (
    <div>
      {essays.map((essay, index) => (
        <div key={index} className="mb-6">
          <h3 className="text-xl font-semibold">{essay.title}</h3>
          <p className="mt-2 text-gray-700">{essay.content}</p>
        </div>
      ))}
    </div>
  );
};

export default Essays;
