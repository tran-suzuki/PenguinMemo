import { useState, useCallback } from 'react';

/**
 * パスワードなどの秘匿値の表示/非表示トグルを管理する共通フック。
 * 複数箇所で重複していた showXxx state + toggle のパターンを統一する。
 */
export function usePasswordVisibility(initial = false) {
  const [visible, setVisible] = useState(initial);
  const toggle = useCallback(() => setVisible(v => !v), []);
  return { visible, toggle, setVisible };
}
