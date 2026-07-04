import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { decodeSharePayload } from '../lib/share';
import { saveProject } from '../lib/persistence';
import { useProjectStore } from '../store/projectStore';

export function SharePage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const setProject = useProjectStore((state) => state.setProject);
  const [error, setError] = useState('');
  useEffect(() => {
    try {
      const payload = params.get('p');
      if (!payload) throw new Error('分享链接缺少背景配置');
      const project = decodeSharePayload(payload);
      saveProject(project);
      setProject(project);
      navigate(`/editor/${project.id}`, { replace: true });
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : '分享链接无法读取';
      queueMicrotask(() => setError(message));
    }
  }, [navigate, params, setProject]);
  if (error) return <main className="route-message"><h1>无法打开这个背景</h1><p>{error}</p><a className="primary-button" href="/">返回模板库</a></main>;
  return <main className="route-message"><div className="route-loader" /><h1>正在打开背景</h1><p>我们会创建一份新的本地副本。</p></main>;
}
