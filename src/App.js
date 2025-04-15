import { useState } from "react";

export default function App() {
  const [input, setInput] = useState("");
  const [totalGoods, setTotalGoods] = useState("");
  const [output, setOutput] = useState("");

  function parseAndAllocate() {
    const lines = input.trim().split("\n");
    const stores = lines.map((line) => {
      const [name, salesStr] = line.split(/\s+/);
      const sales = parseFloat(salesStr);
      return { name, sales };
    });

    const total = parseInt(totalGoods);
    if (isNaN(total) || total <= 0 || stores.length === 0) {
      setOutput("请输入有效的总货量和门店数据。");
      return;
    }

    const baseAlloc = stores.map(() => 1);
    let remaining = total - stores.length;

    if (remaining < 0) {
      setOutput("门店数量超过总货量，无法保证每店1件。");
      return;
    }

    const weighted = stores.map(({ sales }) => {
      let weight = 1;
      if (sales >= 300000) weight = 1.4;
      else if (sales >= 250000) weight = 1.3;
      else if (sales >= 200000) weight = 1.2;
      else if (sales >= 150000) weight = 1.1;
      else if (sales >= 100000) weight = 1.05;
      return sales * weight;
    });

    const totalWeighted = weighted.reduce((a, b) => a + b, 0);
    const provisional = weighted.map((w) => (w / totalWeighted) * remaining);
    const remainders = provisional.map((val) => val - Math.floor(val));

    for (let i = 0; i < stores.length; i++) {
      const add = Math.min(4, Math.floor(provisional[i]));
      baseAlloc[i] += add;
      remaining -= add;
    }

    while (remaining > 0) {
      let maxR = -1;
      let maxIdx = -1;
      for (let i = 0; i < stores.length; i++) {
        if (remainders[i] > maxR && baseAlloc[i] < 5) {
          maxR = remainders[i];
          maxIdx = i;
        }
      }
      if (maxIdx === -1) break;
      baseAlloc[maxIdx]++;
      remainders[maxIdx] = -1;
      remaining--;
    }

    const result = stores.map((store, i) => `${store.name}\t${store.sales}元\t${baseAlloc[i]}件`).join("\n");
    setOutput(result);
  }

  return (
    <div style={{ maxWidth: 600, margin: '2rem auto', padding: '1rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>门店分货神器 Pro</h1>
      <input
        type="number"
        placeholder="请输入总货量（件）"
        value={totalGoods}
        onChange={(e) => setTotalGoods(e.target.value)}
        style={{ width: '100%', margin: '1rem 0', padding: '0.5rem' }}
      />
      <textarea
        placeholder="请输入门店及销售额（每行：门店名 空格 销售额）"
        rows={10}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        style={{ width: '100%', padding: '0.5rem', fontFamily: 'monospace' }}
      />
      <button onClick={parseAndAllocate} style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}>开始分货</button>
      <pre style={{ marginTop: '1rem', background: '#f9f9f9', padding: '1rem', whiteSpace: 'pre-wrap' }}>{output}</pre>
    </div>
  );
}
