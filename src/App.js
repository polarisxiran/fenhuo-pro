import { useState } from "react";
import * as XLSX from "xlsx";

export default function App() {
  const [input, setInput] = useState("");
  const [totalGoods, setTotalGoods] = useState("");
  const [output, setOutput] = useState([]);

  const parseAndAllocate = () => {
    let rows = input.trim().split("\n").map((line) => line.split(/\t|\s{2,}|,|\s/).filter(Boolean));
    let stores = rows.map(([name, salesStr]) => ({ name, sales: parseFloat(salesStr) }));
    const total = parseInt(totalGoods);

    if (isNaN(total) || total <= 0 || stores.length === 0) {
      setOutput([["请输入有效的总货量和门店数据"]]);
      return;
    }

    const baseAlloc = stores.map(() => 1);
    let remaining = total - stores.length;
    if (remaining < 0) {
      setOutput([["门店数量超过总货量，无法保证每店1件"]]);
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

    const result = stores.map((store, i) => [store.name, `${store.sales}元`, `${baseAlloc[i]}件`]);
    setOutput(result);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
      const cleanRows = data.filter(row => row.length >= 2 && row[1] !== undefined);
      const formatted = cleanRows.map(row => `${row[0]}\t${row[1]}`).join("\n");
      setInput(formatted);
    };
    reader.readAsBinaryString(file);
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.aoa_to_sheet([["门店", "销售额", "分配件数"], ...output]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "分货结果");
    XLSX.writeFile(wb, "分货结果.xlsx");
  };

  const clearAll = () => {
    setInput("");
    setTotalGoods("");
    setOutput([]);
  };

  return (
    <div style={{ maxWidth: 800, margin: '2rem auto', padding: '1rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>门店分货神器 Pro</h1>

      <input
        type="number"
        placeholder="请输入总货量（件）"
        value={totalGoods}
        onChange={(e) => setTotalGoods(e.target.value)}
        style={{ width: '100%', margin: '1rem 0', padding: '0.5rem' }}
      />

      <textarea
        placeholder="请输入门店及销售额（可直接从Excel复制两列数据）"
        rows={10}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        style={{ width: '100%', padding: '0.5rem', fontFamily: 'monospace' }}
      />

      <input type="file" accept=".xls,.xlsx" onChange={handleFileUpload} style={{ margin: '1rem 0' }} />

      <div style={{ margin: '1rem 0' }}>
        <button onClick={parseAndAllocate} style={{ marginRight: 10, padding: '0.5rem 1rem' }}>开始分货</button>
        <button onClick={exportToExcel} style={{ marginRight: 10, padding: '0.5rem 1rem' }}>导出Excel</button>
        <button onClick={clearAll} style={{ padding: '0.5rem 1rem' }}>清空</button>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>门店</th>
            <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>销售额</th>
            <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>分配件数</th>
          </tr>
        </thead>
        <tbody>
          {output.map((row, idx) => (
            <tr key={idx}>
              {row.map((cell, i) => (
                <td key={i} style={{ border: '1px solid #ccc', padding: '0.5rem' }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}