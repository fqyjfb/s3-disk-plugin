import React from 'react';
import ReactDOM from 'react-dom/client';
import ToolPanel from './ToolPanel';

const PluginApp: React.FC = () => {
  return <ToolPanel />;
};

function renderStandalone() {
  const root = document.getElementById('root');
  if (!root) {
    console.error('根元素未找到');
    return;
  }

  ReactDOM.createRoot(root).render(<PluginApp />);
}

function registerPlugin(api: any) {
  const { registerTool, registerSidebarButton, openPluginWindow } = api;

  registerTool({
    id: 'plugin-s3-disk',
    name: 'S3 云存储管理器',
    iconName: 'HardDrive',
    color: '#3b82f6',
    textColor: '#ffffff',
    path: '/tools/plugin-s3-disk',
    component: ToolPanel,
  });

  registerSidebarButton({
    id: 'plugin-s3-disk-btn',
    icon: 'HardDrive',
    label: 'S3 云存储',
    onClick: () => {
      openPluginWindow?.('plugin-s3-disk');
    },
  });
}

const pluginData = (window as any).__PLUGIN_DATA__;

if (pluginData) {
  renderStandalone();
}
