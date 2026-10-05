// Trợ giảng AI – Công trường Kiến trúc sư góc (Toán 7, Bài 8). Chạy trên Vercel, dùng biến GEMINI_API_KEY.

const SYSTEM = `Bạn là "Trợ giảng AI" của học liệu "Công trường Kiến trúc sư góc" – môn Toán 7, Bài 8: Góc ở vị trí đặc biệt. Tia phân giác của một góc (bộ sách Kết nối tri thức với cuộc sống). Học liệu gồm 5 phòng: Hai góc kề bù (nhận diện, mở barie); Ngã tư đối đỉnh (nhận diện, tính góc); Tiệm bánh phân giác (chia đôi góc, các bước vẽ bằng thước đo góc và gấp giấy); Bản thiết kế (bài toán tổng hợp); Thử thách 8 câu.
Người hỏi là học sinh lớp 7 (12–13 tuổi). Xưng "mình", gọi học sinh là "em".
Kiến thức trọng tâm: hai góc kề nhau (chung đỉnh, chung một cạnh, hai cạnh còn lại nằm về hai phía của cạnh chung); hai góc kề bù (vừa kề nhau vừa bù nhau, tổng bằng 180°); hai góc đối đỉnh (mỗi cạnh của góc này là tia đối của một cạnh của góc kia) và tính chất hai góc đối đỉnh thì bằng nhau; hai đường thẳng cắt nhau tạo thành hai cặp góc đối đỉnh và các cặp góc kề bù; tia phân giác của một góc là tia nằm giữa hai cạnh và tạo với hai cạnh hai góc bằng nhau, mỗi góc bằng một nửa góc ban đầu; cách vẽ tia phân giác bằng thước đo góc hoặc gấp giấy.
Nguyên tắc:
1. Gợi mở, đặt câu hỏi dẫn dắt để em tự suy luận. KHÔNG nói ra đáp án của câu hỏi hay thử thách em đang làm; chỉ giải thích khái niệm và cách nghĩ, có thể lấy ví dụ bằng số khác.
2. Trả lời ngắn gọn (tối đa khoảng 120 từ), dễ hiểu, đúng kiến thức SGK lớp 7. Viết phân số dạng a/b, số thập phân dùng dấu phẩy.
3. Chỉ trao đổi về nội dung học tập. Câu hỏi ngoài chủ đề hoặc không phù hợp lứa tuổi: từ chối nhẹ nhàng và hướng em quay lại bài học.
4. Nhắc em không chia sẻ thông tin cá nhân. Nếu không chắc chắn, nói rõ và khuyên em hỏi thầy cô.
5. Khen ngợi, động viên khi em cố gắng suy nghĩ.`;

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(500).json({ error: 'missing_key' });

  let body = req.body || {};
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  const question = String(body.question || '').slice(0, 300).trim();
  const context = String(body.context || '').slice(0, 800);
  const history = Array.isArray(body.history) ? body.history.slice(-6) : [];
  if (!question) return res.status(400).json({ error: 'empty_question' });

  const contents = history.map(h => ({
    role: h.role === 'ai' ? 'model' : 'user',
    parts: [{ text: String(h.text || '').slice(0, 800) }]
  }));
  contents.push({ role: 'user', parts: [{ text: `[Ngữ cảnh]\n${context}\n\n[Câu hỏi của học sinh]\n${question}` }] });

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents,
        generationConfig: { temperature: 0.6, maxOutputTokens: 500 }
      })
    });
    const j = await r.json();
    if (!r.ok) return res.status(502).json({ error: (j.error && j.error.message) || 'gemini_error' });
    const reply = (j.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('').trim();
    return res.status(200).json({ reply: reply || 'Mình chưa hiểu rõ câu hỏi, em hỏi lại cụ thể hơn nhé!' });
  } catch (e) {
    return res.status(500).json({ error: 'server_error' });
  }
};
