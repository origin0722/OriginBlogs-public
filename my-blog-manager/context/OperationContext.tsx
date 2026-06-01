"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

// 定义操作的类型
export type OperationType = 'POST' | 'CHATTER' | 'CONFIG' | 'GALLERY' | 'FRIEND';

export interface Operation {
  id: string;
  type: OperationType;
  label: string;      // 显示在列表里的简短描述，如 "修改文章：GNN研究"
  description: string; // 详细描述
  timestamp: string;
  payload: any;       // 实际要修改的数据内容
}

interface OperationContextType {
  operations: Operation[];
  addOperation: (op: Omit<Operation, 'id' | 'timestamp'>) => void;
  removeOperation: (id: string) => void;
  clearOperations: () => void;
}

const OperationContext = createContext<OperationContextType | undefined>(undefined);

export function OperationProvider({ children }: { children: React.ReactNode }) {
  const [operations, setOperations] = useState<Operation[]>([]);

  // 添加操作（如果同类型的操作已存在，则覆盖，防止重复积攒）
  const addOperation = (op: Omit<Operation, 'id' | 'timestamp'>) => {
    const newOp: Operation = {
      ...op,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setOperations(prev => {
      // 如果是修改同一个文件，先过滤掉旧的，再加新的
      const filtered = prev.filter(item => !(item.type === op.type && item.label === op.label));
      return [...filtered, newOp];
    });
  };

  const removeOperation = (id: string) => {
    setOperations(prev => prev.filter(op => op.id !== id));
  };

  const clearOperations = () => setOperations([]);

  return (
    <OperationContext.Provider value={{ operations, addOperation, removeOperation, clearOperations }}>
      {children}
    </OperationContext.Provider>
  );
}

// 导出 Hook 方便其他组件调用
export const useOperations = () => {
  const context = useContext(OperationContext);
  if (!context) throw new Error("useOperations must be used within an OperationProvider");
  return context;
};