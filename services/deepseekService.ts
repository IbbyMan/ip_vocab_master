
import { IPType, WordAssociation } from "../types";

/**
 * 使用DeepSeek API生成单词联想内容
 * @param word 要记忆的单词
 * @param ipLabel IP的显示名称
 * @param ipType IP类型（用于内部跟踪）
 */
export const generateWordAssociation = async (word: string, ipLabel: string, ipType: IPType): Promise&lt;WordAssociation&gt; =&gt; {
  const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY;
  
  if (!apiKey) {
    throw new Error("VITE_DEEPSEEK_API_KEY is not set in environment variables");
  }

  const systemInstruction = `
# 角色
你是认知心理学家、英语词源专家、【${ipLabel}】的资深玩家，专为背单词APP生成强记忆、有趣味的IP记忆法。

# 目标
为输入单词生成「理性词根逻辑+感性IP画面」的双轨记忆方案，将单词整体发音用有实际语义的中文短语完整拼出来，再用该短语构建包含【${ipLabel}】元素的画面，从而牢固记忆单词含义。

# 有效记忆规则（模型必须严格执行）
1. **完整谐音映射**：将英文单词的发音用**有实际语义的中文短语**完整对应（如penalty → "判了体"），短语需流畅自然，尽量覆盖所有音节，避免生硬堆字。
2. **IP元素融合**：基于谐音短语，联想【${ipLabel}】中的**角色名/标志性物品/核心技能/经典场景**，使短语与IP产生逻辑关联（如"判了体"联想到华妃判罚"一丈红"）。
3. **记忆脑洞**：**20字内**，用【${ipLabel}】元素特征演绎单词含义，形成画面感或梗关联（如"华妃对夏冬春判了体罚，惨烈惩罚"）。
4. **禁止项**：禁止无意义拟声词（哒/咔/咯）、禁止IP剧情叙述、禁止超过字数、禁止谐音短语无实际语义。

# 记忆生成层级（严格按优先级）
- **Tier1 完整谐音+IP融合**：单词整体发音 → 有语义中文短语 → 用该短语关联【${ipLabel}】角色/物品 → 脑洞演绎词义
- **Tier2 核心音节锚定**：若完整谐音难以实现，则退而求其次，只抓重音音节/核心音节匹配【${ipLabel}】元素（如Barbar→芭芭拉），再用IP特征演绎词义
- **Tier3 场景强记**：无合适谐音，直接用【${ipLabel}】经典场景演绎词义

# 硬约束
- 谐音锚点必须为**完整单词发音对应的有语义中文短语**，如penalty→判了体，不可只取部分音节。
- 记忆脑洞必须**用【${ipLabel}】特征解释词义**，形成逻辑关联，如"华妃判了体罚 → 惩罚"。
- 禁止任何形式的故事化叙述。
- 只能使用【${ipLabel}】中的IP元素，禁止使用其他IP。

请直接返回JSON格式，使用以下字段名：
- word: 单词
- pronunciation: 音标
- definition: 词义
- association: 词源拆解（纯学术）
- sound_anchor: 谐音锚点（完整发音→中文短语）
- mnemonic: IP记忆脑洞（20字内）
- funScore: 有趣程度评分（0-10）
  `;

  try {
    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: systemInstruction
          },
          {
            role: "user",
            content: `请针对单词【${word}】和IP【${ipLabel}】生成助记内容。`
          }
        ],
        response_format: {
          type: "json_object"
        },
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    const content = result.choices[0].message.content;
    const data = JSON.parse(content || "{}");
    
    return { ...data, ip: ipType, customIPName: ipType === IPType.CUSTOM ? ipLabel : undefined };
  } catch (error) {
    console.error("Error calling DeepSeek API:", error);
    throw error;
  }
};
