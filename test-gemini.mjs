import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI('AIzaSyCWCN_KFqZBXPR4Wybw-qBRC8Jk7Trv6B8');
async function run() {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  try {
    const result = await model.generateContent("Hello");
    console.log(result.response.text());
  } catch (e) {
    console.error(e);
  }
}
run();
