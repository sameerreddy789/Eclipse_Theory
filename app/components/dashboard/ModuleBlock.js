"use client";

import { X, Plus } from "lucide-react";

export default function ModuleBlock({ 
  mod, 
  mi, 
  onUpdateName, 
  onRemove, 
  onAddTopic, 
  onRemoveTopic, 
  onUpdateTopicName 
}) {
  return (
    <div className="module-block">
      <div className="module-head">
        <div className="module-head-left">
          <span className="module-num">{mi + 1}</span>
          <input 
            type="text" 
            placeholder="Module name..." 
            value={mod.name} 
            onChange={(e) => onUpdateName(mod.id, e.target.value)} 
          />
        </div>
        <button type="button" className="btn-remove" onClick={() => onRemove(mod.id)}>
          <X size={14} />
        </button>
      </div>
      <div className="module-body">
        <div className="topics-list">
          {mod.topics.map((topic, ti) => (
            <div className="topic-row" key={topic.id}>
              <span className="topic-num">{mi + 1}.{ti + 1}</span>
              <input 
                type="text" 
                placeholder="Topic name..." 
                value={topic.name} 
                onChange={(e) => onUpdateTopicName(mod.id, topic.id, e.target.value)} 
              />
              <button type="button" className="btn-remove" onClick={() => onRemoveTopic(mod.id, topic.id)}>
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
        <div className="module-actions">
          <button type="button" className="btn-add" onClick={() => onAddTopic(mod.id)}>
            <Plus size={12} /> Add Topic
          </button>
        </div>
      </div>
    </div>
  );
}
