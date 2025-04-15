import { useState } from "react";
import * as XLSX from "xlsx"; // 导入xlsx库

export default function App() {
  const [input, setInput] = useState("");
  const [totalGoods, setTotalGoods] = useState("");
  const [output, setOutput] = useState("");

  // 处理粘贴事件
  const handlePaste = (e) => {
    const pastedData = e.clipboardData.getData("Text");
    const formattedData = pastedData
      .trim()
      .replace(/\r?\n/g, "\n") // 确保换行符统一
      .replace(/\t/g, " ");    // 将 Tab 键转换为空格（可根据需求修改）
    
    setInput(formattedData);
    e.preventDefault(); // 阻止默认行为
  };

  // 处理文件上传
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const binaryString = event.target.result;
        const workbook = XLSX.read(binaryString, { type: "binary" });
        
        // 解析第一个工作表（sheet）
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        
        // 转换表格数据为 JSON 格式
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        // 提取店名和销售额，假设第一列是店名，第二列是销售额
        const storesData = jsonData.map(row => {
          const name = row[0]; // 店名
          const sales = parseFloat(row[1]); // 销售额
          return { name, sales };
        });

        // 将数据格式化为字符串形式，用于输入框显示
        const formattedInput = storesData
          .map(store => `${store.name} ${store.sales}`)
          .join("\n");

        setInput(formattedInput);
      };
      reader.readAsBinaryString(file);
    }
  };

  function parseAndAllocate() {
    const lines = input.trim().split("\n");
    const stores = lines.map((line) => {
      const [name, salesStr] = line.split(/\s+/); // 按空格分割
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
      
      {/* 上传文件按钮 */}
      <input
        type="file"
        accept=".xlsx, .xls"
        onChange={handleFileUpload}
        style={{ width: '100%', margin: '1rem 0', padding: '0.5rem' }}
      />

      <textarea
        placeholder="请输入门店及销售额（每行：门店名 空格 销售额）"
        rows={10}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onPaste={handlePaste} // 监听粘贴事件
        style={{ width: '100%', padding: '0.5rem', fontFamily: 'monospace' }}
      />
      <button onClick={parseAndAllocate} style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}>开始分货</button>
      <pre style={{ marginTop: '1rem', background: '#f9f9f9', padding: '1rem', whiteSpace: 'pre-wrap' }}>{output}</pre>
    </div>
  );
}