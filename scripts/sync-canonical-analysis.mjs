import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const projectsPath = path.join(root, "docs", "projects.json");
const dailyDir = path.join(root, "docs", "daily");
const updatedAt = process.argv.includes("--date")
  ? process.argv[process.argv.indexOf("--date") + 1]
  : new Date().toISOString().slice(0, 10);

const analysisKeys = [
  "overview", "what_it_is", "target_users", "problem", "past_solution",
  "how_it_works", "architecture", "why_hot", "difference", "business",
  "china_opportunity", "use_cases", "risks", "inspiration", "judgment",
  "full_analysis"
];
const placeholder = value => typeof value === "string" && /历史日报恢复|该项目曾出现在|历史日报恢复记录/.test(value);
const usable = value => typeof value === "string" && value.trim() && !placeholder(value);

const overrides = {
  "voice-studio": {
    target_users: "短视频与播客团队、游戏和漫剧制作方、需要私有化语音能力的企业，以及批量配音工具开发者。",
    problem: "声音克隆、TTS、ASR、翻译、视频对齐和批处理通常分散在多个模型与工具中，角色管理和重复生产成本高。",
    past_solution: "分别使用在线 TTS、声音克隆网站、字幕工具和剪辑软件，再由人工完成音色管理、切句、对齐和导出。",
    how_it_works: "在同一工作台中管理声音样本与角色，调用本地或可配置的语音模型完成克隆、合成、识别和视频配音，并通过队列处理批量任务。",
    architecture: "整体是桌面/本地优先的语音生产工作台，上层负责项目、角色和批任务，下层连接 TTS、ASR、声音克隆及媒体处理能力。",
    difference: "差异不在单个语音模型，而在把多角色声音资产、识别、合成、视频配音和批处理整合成可持续使用的生产流程。",
    china_opportunity: "可接入中文和方言模型，服务漫剧、游戏角色、跨境视频、企业培训与私有语音库，并按席位、算力或项目收费。",
    use_cases: "漫剧多角色配音、游戏 NPC 声线、短视频批量本地化、播客修复、企业培训和品牌声音资产管理。",
    risks: "需要处理声音授权、冒用风险、模型许可证、显存成本、跨语言自然度和长视频音画同步。",
    inspiration: "语音产品的价值正在从单次生成转向可管理的角色资产和批量内容流水线。",
    judgment: "值得重点研究。更好的商业切口是垂直内容生产工作流，而不是再做一个通用 TTS 页面。"
  },
  "mirofish": {
    target_users: "品牌市场、广告创意、舆情研究、游戏运营、产品研究和需要低成本群体实验的团队。",
    problem: "真实问卷、焦点小组和用户实验速度慢、成本高且难以频繁重复；单一模型回答又无法表现群体中的身份差异和相互影响。",
    past_solution: "使用问卷、访谈、焦点小组、社媒舆情分析、A/B 测试，或由研究团队搭建规则型仿真模型。",
    how_it_works: "为多个 Agent 设置身份、记忆、偏好和关系，让它们在同一事件或环境下持续互动，再汇总意见变化、传播路径和群体结果。",
    architecture: "核心是多 Agent 编排、角色画像、长期记忆、事件驱动模拟与结果聚合；具体模型与存储实现应以项目仓库版本为准。",
    difference: "它不是让一个模型扮演许多人，而是保留个体差异和互动历史，观察群体行为如何随事件逐步演化。",
    china_opportunity: "可结合中文社媒语料、行业人群包和本地模型，做广告概念预演、舆情推演、私域活动模拟与游戏经济沙盘。",
    use_cases: "广告脚本预评估、虚拟消费者研究、危机舆情演练、游戏活动与经济系统模拟、产品概念筛选。",
    risks: "虚拟人群不能替代真实用户；结果会受到角色设定、模型偏差、样本代表性和推理成本影响，必须用真实数据校准。",
    inspiration: "可先用虚拟群体快速淘汰明显无效方案，再把少量高潜方案交给真实用户验证，从而降低研究成本。",
    judgment: "方向很有启发，适合作为研究前置工具而非真实市场结论。商业价值取决于垂直人群数据和校准能力。"
  },
  "agent-reach": {
    target_users: "研究 Agent、内容团队、品牌与竞品分析人员、增长团队以及跨平台数据工具开发者。",
    problem: "公开内容分散在多个平台，接口、登录、页面结构和媒体格式不统一，Agent 很难稳定获取可引用的数据。",
    past_solution: "人工搜索与复制，分别接入平台 API，或为每个平台维护独立爬虫、下载器和转写流程。",
    how_it_works: "为不同内容平台提供统一访问入口，将帖子、视频、评论、字幕和仓库信息转成 Agent 可消费的结构化结果。",
    architecture: "整体是平台适配器层加统一调用接口，并组合抓取、解析、媒体处理和内容标准化；平台登录与限制按连接器分别处理。",
    difference: "重点不是通用搜索，而是把跨平台读取能力封装成 Agent 可以重复调用的基础工具。",
    china_opportunity: "可围绕小红书、抖音、B站、公众号和海外平台做合规的数据连接器，服务品牌情报、素材研究和选题生产。",
    use_cases: "竞品素材雷达、品牌舆情、跨平台选题、视频转写、开源项目研究和行业信息监控。",
    risks: "平台条款、版权、账号风控、反自动化、接口频繁变化和数据来源可追溯性是主要风险。",
    inspiration: "很多 Agent 产品的瓶颈不是模型，而是能否稳定、合法地获取真实世界信息。",
    judgment: "基础设施价值高，但维护成本也高。建议从少数高价值平台和明确业务场景切入。"
  },
  "ruview": {
    target_users: "养老与居家看护机构、智能家居厂商、办公空间运营方、酒店、IoT 集成商和隐私敏感场所。",
    problem: "摄像头感知存在隐私和遮挡问题，PIR 等传统传感器信息有限，专用雷达又增加硬件与部署成本。",
    past_solution: "使用摄像头、红外传感器、门磁、毫米波雷达、可穿戴设备或人工巡检。",
    how_it_works: "分析 Wi-Fi 信号在人体存在、移动和呼吸影响下产生的变化，通过信号处理和模型推断空间中的活动状态。",
    architecture: "典型链路包括 Wi-Fi 信号采集、CSI/信号特征处理、时序模型或分类算法以及告警/可视化层；硬件兼容以仓库说明为准。",
    difference: "利用已有无线网络进行无摄像头感知，在隐私、覆盖和改造成本之间提供新的平衡。",
    china_opportunity: "适合本地化为养老跌倒/异常监测、酒店节能、办公室 occupancy 和智能家居模组，并与国产路由器和边缘设备结合。",
    use_cases: "人员存在检测、睡眠与呼吸趋势、空间利用率、异常活动提醒、节能联动和无人区域巡检。",
    risks: "不同房型和设备会影响准确率；医疗结论、误报漏报、无线电合规和隐私告知必须谨慎处理。",
    inspiration: "既有基础设施的数据可能被重新解释成新的传感器能力，形成软硬件结合的垂直产品。",
    judgment: "技术和商业想象力都强，但从 Demo 到可靠产品需要大量场景标定与硬件适配。"
  },
  "deskcommcrm": {
    target_users: "依赖 WhatsApp 或私域消息获客的中小企业、销售团队、客服团队和行业 CRM 服务商。",
    problem: "客户对话、跟进任务、销售阶段和 AI 回复分散，线索容易遗漏，管理者也难以观察销售过程。",
    past_solution: "WhatsApp/企微人工聊天、电子表格、独立 CRM、客服系统和零散自动回复机器人。",
    how_it_works: "把消息会话绑定客户和销售管道，由 AI Agent 处理接待、信息提取、跟进建议与任务推进，同时保留人工接管。",
    architecture: "核心是消息渠道连接器、CRM 数据模型、销售工作流、Agent/模型层以及权限和审计界面。",
    difference: "不是在 CRM 外增加聊天机器人，而是让 AI 直接读写客户记录并推动销售阶段变化。",
    china_opportunity: "可迁移到企微、飞书和钉钉，围绕教育、跨境、电商、房产和本地服务提供行业模板与私有部署。",
    use_cases: "线索接待、自动建档、销售跟进、沉默客户唤醒、报价提醒、客服转销售和团队漏斗分析。",
    risks: "消息平台政策、客户隐私、错误承诺、销售数据权限和 Agent 自动操作边界需要严格控制。",
    inspiration: "企业 AI 的价值来自嵌入交易流程并完成记录和动作，而不只是生成一段回复。",
    judgment: "商业路径明确，国内本地化潜力高；优先做单一行业闭环，避免一开始复制完整 CRM。"
  },
  "mathmodelagent": {
    target_users: "数学建模竞赛参与者、科研与数据分析团队，以及希望把专业方法封装给 Agent 的行业专家。",
    problem: "数学建模涉及问题拆解、假设、模型选择、代码实验、结果解释和论文写作，通用 Agent 容易遗漏步骤或缺乏验证。",
    past_solution: "人工查找论文和模板，使用 MATLAB/Python 独立实验，再手工整理图表和论文。",
    how_it_works: "把建模任务拆成可调用的专业 Skills，约束 Agent 按问题定义、数据处理、模型构建、实验验证和报告输出执行。",
    architecture: "本质是专业知识与工作流层，连接代码执行、数据分析、绘图和文档生成工具，而不是重新训练基础模型。",
    difference: "重点在可复用、可审查的专业步骤，让不同 Agent 都能遵循同一套建模方法。",
    china_opportunity: "可将同样方式用于投放分析、SEO、投标、财务、供应链和运营等岗位，形成行业 Skill Pack。",
    use_cases: "竞赛建模、研究数据分析、预测与优化、实验报告、专业岗位流程自动化。",
    risks: "错误假设和伪相关会被自动化放大，结果必须保留数据来源、代码、指标和人工复核。",
    inspiration: "专业 Agent 的壁垒可能来自方法论、数据和验收标准，而不是新的聊天界面。",
    judgment: "项目本身偏垂直，但验证了专家流程 Skill 化的路线，值得迁移到更强付费场景。"
  },
  "omniget": {
    target_users: "需要离线保存公开视频或课程的个人、学习者、内容研究者和本地媒体管理用户。",
    problem: "成熟 CLI 下载工具功能强但参数复杂，下载、转码、字幕和文件管理对普通用户门槛高。",
    past_solution: "直接使用 yt-dlp 等命令行工具、网页下载站、浏览器扩展或分别处理转码与字幕。",
    how_it_works: "用桌面界面收集链接和下载选项，调用成熟下载/媒体处理能力完成抓取、转码、字幕和任务管理。",
    architecture: "跨平台桌面外壳加下载引擎、FFmpeg 等媒体处理组件，并提供队列、历史记录和设置管理。",
    difference: "将强大的开源 CLI 能力包装成普通用户可理解的完整桌面体验。",
    china_opportunity: "可用于用户有权保存的课程、公开资料和自有内容归档，并增加中文界面、学习库和知识提取。",
    use_cases: "离线课程、公开视频归档、自有频道备份、字幕提取、媒体格式转换和个人知识库导入。",
    risks: "必须遵守版权、平台条款和访问权限；上游网站变化也会带来持续维护成本。",
    inspiration: "把成熟开源组件产品化，常比重新发明底层能力更快形成用户价值。",
    judgment: "产品化案例值得借鉴，但商业化要围绕合法内容管理和学习工作流。"
  },
  "yue2": {
    target_users: "音乐创作者、游戏与广告团队、短视频制作方，以及需要可编辑 AI 音乐的内容产品。",
    problem: "黑盒文生音乐难以精确控制旋律、和弦、段落和迭代方向，生成结果也不方便进入后续音乐制作。",
    past_solution: "使用传统 DAW 和作曲工具人工创作，或生成整首音乐后反复抽卡并进行有限剪辑。",
    how_it_works: "先生成或接受可编辑的旋律、和弦与结构规划，再据此渲染人声和编曲，使创作者能在规划层反复修改。",
    architecture: "整体分为音乐规划/条件层与音频生成层，并通过结构化中间表示连接编辑和最终渲染。",
    difference: "把 AI 音乐从一次性黑盒输出变成有中间层、可控制、可迭代的音乐工程。",
    china_opportunity: "适合游戏 BGM、短视频配乐、广告音乐模板、角色主题曲和本地化歌曲生产。",
    use_cases: "旋律草稿、和弦变体、游戏场景音乐、广告配乐、角色歌曲和创作者辅助。",
    risks: "训练数据与版权、声音相似性、生成一致性、长曲结构和商业授权仍需核查。",
    inspiration: "高价值生成工具往往需要可编辑的中间表示，而不是只提供最终成品。",
    judgment: "方向优于纯文本到歌曲 Demo，值得关注其编辑性和创作流程能否真正落地。"
  },
  "claude-red": {
    target_users: "授权安全测试人员、红队与蓝队、安全顾问，以及需要把专家方法交给 Agent 的企业。",
    problem: "安全测试方法庞杂且强依赖经验，通用 Agent 容易遗漏步骤、误用工具或缺乏证据链。",
    past_solution: "依靠专家手册、个人脚本、渗透框架、检查清单和人工带教。",
    how_it_works: "把安全方法、检查步骤、工具用法和输出规范封装成 Claude 可加载的结构化 Skills。",
    architecture: "属于 Agent 的知识与工作流层，通过 Skill 文件连接已有安全工具，不替代授权、隔离环境和人工判断。",
    difference: "重点是系统整理专家操作方法，使其可复用和可审查，而不是新增一种扫描器。",
    china_opportunity: "可扩展为企业内部安全检查、合规审计和私有化安全 Agent，也可迁移成其他岗位 Skill 库。",
    use_cases: "授权渗透测试准备、漏洞验证流程、报告模板、蓝队检查和安全培训。",
    risks: "必须限制在授权场景；错误或过时步骤会带来安全和法律风险，敏感工具执行需沙箱和审计。",
    inspiration: "专家经验可以作为版本化资产交给 Agent，但必须同时编码权限、证据和停止条件。",
    judgment: "方法论价值高，商业化应面向企业授权安全与合规，不应做无边界自动攻击。"
  },
  "ever-gauzy": {
    target_users: "需要开源 ERP/CRM/HRM/项目管理的企业、实施商，以及希望为企业 Agent 提供业务底座的开发团队。",
    problem: "企业 Agent 如果没有客户、员工、项目、工时和财务等结构化数据，只能停留在问答层。",
    past_solution: "分别采购 ERP、CRM、HR、项目管理系统，再通过 API 或人工导出把数据提供给 AI。",
    how_it_works: "在统一业务系统中管理组织、客户、项目、任务、工时和运营数据，为工作流与 Agent 提供可操作对象。",
    architecture: "属于模块化企业应用底座，包含前后端、业务数据模型、权限和多种业务模块，可在其 API/数据层之上增加 Agent。",
    difference: "价值在完整开源业务数据和操作面，而不是单一 AI 功能；可避免从零搭建企业系统。",
    china_opportunity: "可结合企微、飞书、钉钉、国产模型和行业流程，提供私有部署的企业 AI 工作台。",
    use_cases: "AI 项目助理、工时分析、销售跟进、员工服务、项目风险提醒和跨系统运营。",
    risks: "系统范围大、实施复杂；本地财税和劳动规则、权限、数据迁移与升级维护成本高。",
    inspiration: "企业 Agent 的护城河往往来自可执行的业务系统和数据，而不是聊天窗口。",
    judgment: "适合作为企业 Agent 的开源底座研究，但应先选择一个模块和行业形成闭环。"
  },
  "gods-eye-view": {
    target_users: "OSINT 与地缘研究者、媒体、物流和商业情报团队、数据可视化开发者及普通极客用户。",
    problem: "航班、船舶、卫星、地震、摄像头等实时数据分散在不同网站，专业界面难以形成统一认知和传播。",
    past_solution: "分别使用 FlightRadar、MarineTraffic、卫星与地震网站、GIS 工具和人工汇总报告。",
    how_it_works: "聚合多种公开实时数据并映射到交互式 3D 地球，以图层、对象追踪和 AI/语音交互帮助用户探索事件。",
    architecture: "前端以 3D 地球和实时图层为核心，后端/连接器接入多种公开数据源，再由搜索或 AI 层统一交互。",
    difference: "它把专业数据包装成接近游戏和军事 HUD 的体验，降低理解门槛并显著增强传播性。",
    china_opportunity: "可做全球商业情报、国际新闻地图、航运港口监测、商品供应链和自动生成数据视频。",
    use_cases: "热点事件可视化、航运与物流观察、媒体直播画面、OSINT 调查、数据型短视频和教学。",
    risks: "数据授权、延迟和准确性、敏感信息、地图合规以及将相关性误判为因果都需处理。",
    inspiration: "公开数据加统一空间界面和强视觉叙事，可以从专业工具升级为大众内容产品。",
    judgment: "产品传播公式非常值得学习；商业化应聚焦一个高付费情报或媒体场景，而非无限堆数据源。"
  },
  "brewui": {
    target_users: "不熟悉终端的 macOS 用户、开发者工具新手和需要管理 Homebrew 软件的普通用户。",
    problem: "Homebrew 功能强，但安装、搜索、更新、清理和故障处理依赖命令行，限制了非技术用户。",
    past_solution: "直接使用 brew 命令、查阅文档，或使用零散第三方 GUI。",
    how_it_works: "通过原生 macOS 界面展示包和 cask，调用 Homebrew 完成搜索、安装、升级、卸载与维护。",
    architecture: "原生桌面 UI 作为 Homebrew 的操作和状态展示层，底层仍复用成熟的 brew 包管理能力。",
    difference: "由 Homebrew 生态直接推动的原生 GUI，有机会在兼容性和用户信任上优于第三方包装。",
    china_opportunity: "可借鉴为开发者工具的一键安装器、环境管理器和企业内部软件门户。",
    use_cases: "软件发现与安装、批量更新、环境清理、新电脑初始化和新手开发环境配置。",
    risks: "GUI 必须正确处理权限、失败日志和复杂依赖；单纯界面包装的商业壁垒有限。",
    inspiration: "成熟 CLI 的下一阶段增长往往来自降低安装和运维门槛，而不是增加更多底层功能。",
    judgment: "实用性明确，主要价值是产品化与普及；更适合生态入口而非高价独立 SaaS。"
  },
  "system-prompts-leaks": {
    target_users: "Agent 产品经理、提示词与安全研究者、开发者和需要建立企业 Agent 规范的团队。",
    problem: "主流 AI 产品的规划、工具调用、上下文和失败恢复方式隐藏在实现中，团队很难横向学习。",
    past_solution: "依赖零散截图、逆向观察、个人博客和自己反复测试不同产品。",
    how_it_works: "收集并整理公开或流出的系统提示词、工具定义和行为规则，便于按产品和版本对比研究。",
    architecture: "本质是版本化资料库和分类索引，不是运行时 Agent；价值来自样本覆盖、更新速度和分析框架。",
    difference: "提供跨产品的真实提示词与工具配置样本，而不是泛化的 Prompt 教程。",
    china_opportunity: "可在合法边界内建立公开 Agent 行为基准、企业内部规范库和产品拆解数据库。",
    use_cases: "Agent 设计研究、工具调用对比、安全审查、教学和内部系统提示词模板。",
    risks: "来源真实性、版权和服务条款、潜在敏感信息以及直接照搬导致的安全问题必须逐项核验。",
    inspiration: "领先产品的隐性工作流可被拆成可比较的设计模式，但不能把未经核实的泄露内容当最佳实践。",
    judgment: "研究价值高，商业价值更适合落在 Benchmark、治理和企业规范，而不是售卖提示词。"
  },
  "trading-agents": {
    target_users: "量化研究者、金融 AI 开发者、投资研究团队和研究多 Agent 决策结构的产品人员。",
    problem: "单一模型容易产生单边结论，金融决策又要求研究、反方观点、交易执行和风险控制相互制衡。",
    past_solution: "人工分析师团队、量化模型、研究报告与投资委员会，或单 Agent 生成交易建议。",
    how_it_works: "用基本面/技术面分析师、研究员、交易员和风控等角色分工讨论，再把观点交给决策与风险层整合。",
    architecture: "多 Agent 角色编排加市场数据/工具接口、讨论或辩论流程、决策聚合与回测评估。",
    difference: "重点是模拟组织制衡和风险审查，而不是让一个模型直接给买卖信号。",
    china_opportunity: "更适合迁移到广告预算、采购、风控、运营决策等需要多观点审查的企业场景。",
    use_cases: "金融研究实验、多 Agent 决策基准、风险审查流程和复杂业务决策模拟。",
    risks: "不应视为投资建议；数据偏差、回测过拟合、模型幻觉、交易延迟和监管风险都很高。",
    inspiration: "复杂 Agent 系统可以复刻组织中的角色分工与制衡，而不是只追求更多并行角色。",
    judgment: "架构值得学习，自动交易本身风险高。建议重点研究其决策与风控编排。"
  },
  "pentagi": {
    target_users: "获得明确授权的渗透测试团队、企业安全部门、安全服务商和攻防研究人员。",
    problem: "渗透测试涉及侦察、验证、利用、证据记录和报告，工具众多且需要连续决策。",
    past_solution: "安全专家手工使用扫描器和渗透工具，通过笔记和脚本串联流程。",
    how_it_works: "让多个 Agent 负责规划、信息收集、工具执行和结果分析，在隔离环境中持续记录证据与下一步。",
    architecture: "多 Agent 编排层连接安全工具与执行环境，并配合任务状态、日志、存储和可视化界面。",
    difference: "不是增加一个安全扫描器，而是把复杂测试过程变成可观察、可回溯的 Agent 工作流。",
    china_opportunity: "可用于企业私有化授权评估、合规检查、资产暴露验证和自动报告，但必须强化审批和审计。",
    use_cases: "授权渗透测试、攻击面研究、漏洞复现、蓝队验证和安全报告生成。",
    risks: "双重用途风险极高；必须限定目标、权限和工具，使用沙箱、人工审批、完整日志和法律授权。",
    inspiration: "专业 Agent 编排必须把权限、证据、停止条件和人工复核设计成一等能力。",
    judgment: "技术参考价值高，商业化只能面向严格授权的企业安全场景。"
  },
  "douyin-downloader": {
    target_users: "需要备份自有内容的创作者、经授权的内容团队、公开素材研究人员和媒体资产管理开发者。",
    problem: "长期归档短视频需要处理增量、重复、失败重试、元数据、字幕/转写和文件组织，单条解析无法满足。",
    past_solution: "手工保存、使用单条下载网站或临时脚本，再人工去重和整理。",
    how_it_works: "按账号或链接批量抓取内容，维护历史记录避免重复，并组合下载、重试、通知和转写流程。",
    architecture: "平台解析与下载层、任务队列/重试、历史数据库、媒体与元数据存储，以及可选 ASR/通知模块。",
    difference: "工程重点是可持续的增量归档和失败恢复，而不是一次性的链接解析。",
    china_opportunity: "可用于自有账号备份、经授权的品牌素材库和公开竞品研究，并连接 ASR、OCR、标签和内容分析。",
    use_cases: "自有作品备份、授权账号归档、素材检索、字幕提取、内容标签和公开趋势研究。",
    risks: "必须遵守平台条款、版权、隐私和访问权限；接口变化、登录风控和存储成本会增加维护难度。",
    inspiration: "真正有价值的内容工具需要把获取、去重、元数据和后续分析组成完整数据管道。",
    judgment: "工程能力可复用，但产品定位应坚持自有或授权内容管理，避免把下载本身作为卖点。"
  }
};

function defaults(project) {
  const tags = project.tags || [];
  const isAgent = tags.some(x => /Agent|企业AI/.test(x));
  const isContent = tags.some(x => /AIGC|增长|内容/.test(x));
  const isDev = tags.some(x => /开发工具|基础设施/.test(x));
  const audience = isAgent
    ? "使用 AI Agent 的开发者、产品团队和希望把该能力接入业务流程的企业。"
    : isContent
      ? "内容创作者、营销与增长团队，以及需要规模化生产或分析内容的产品团队。"
      : isDev
        ? "开发者、技术团队和需要将该能力集成到现有系统的企业用户。"
        : "对该项目对应问题有持续需求的个人用户、专业团队和产品开发者。";
  const oldWay = isAgent
    ? "过去通常依赖人工执行、零散脚本、单次 Prompt 或多个互不连接的工具。"
    : isContent
      ? "过去通常依赖人工操作多个内容工具，再手工整理、复核和交付结果。"
      : "过去通常依赖人工操作、命令行工具或多个独立系统完成同一流程。";
  const risk = isAgent
    ? "主要风险是模型幻觉、权限过大、数据隐私、执行不可控和第三方接口变化，需保留证据与人工复核。"
    : isContent
      ? "主要风险是输出质量、版权与授权、平台条款、生成成本和批量结果一致性。"
      : "主要风险是兼容性、维护成本、上游依赖变化、数据安全和从 Demo 到稳定生产环境的差距。";
  return {
    overview: project.description,
    what_it_is: project.description,
    target_users: audience,
    problem: usable(project.why) ? project.why : `现有方案难以低成本、稳定地完成“${project.description}”所对应的工作。`,
    past_solution: oldWay,
    how_it_works: `${project.description} 项目把相关步骤组织成可重复使用的工作流，并通过其开源实现连接所需工具与数据。具体执行组件以仓库当前 README 和代码为准。`,
    architecture: "整体由用户入口、核心工作流/服务层、外部工具或数据连接层组成；部署方式和依赖应以项目仓库当前版本为准。",
    why_hot: project.why_hot || project.why || "项目把一个高频但分散的流程做成了更易使用和复用的开源产品。",
    difference: project.why || project.description,
    business: project.business,
    china_opportunity: project.business,
    use_cases: project.business,
    risks: risk,
    inspiration: `可以借鉴其将“${project.description}”产品化的方式，并优先寻找有明确数据、流程和付费主体的垂直场景。`,
    judgment: usable(project.judgment) ? project.judgment : `值得作为${isAgent ? "Agent 工作流" : isContent ? "内容生产/增长工具" : "开源产品化"}案例继续观察；是否投入应以真实用户验证和维护成本为准。`
  };
}

function buildFull(project) {
  return [
    project.overview,
    `目标用户：${project.target_users}`,
    `核心问题：${project.problem}`,
    `过去方案：${project.past_solution}`,
    `工作机制：${project.how_it_works}`,
    `技术与产品形态：${project.architecture}`,
    `近期受到关注的原因：${project.why_hot}`,
    `核心差异化：${project.difference}`,
    `商业化路径：${project.business}`,
    `中国市场机会：${project.china_opportunity}`,
    `可借鉴场景：${project.use_cases}`,
    `风险与限制：${project.risks}`,
    `对我的启发：${project.inspiration}`,
    `明确判断：${project.judgment}`
  ].join("\n\n");
}

const dailyFiles = fs.readdirSync(dailyDir).filter(x => /^\d{4}-\d{2}-\d{2}\.json$/.test(x)).sort();
const dailyDocuments = dailyFiles.map(filename => ({
  filename,
  date: filename.slice(0, 10),
  data: JSON.parse(fs.readFileSync(path.join(dailyDir, filename), "utf8"))
}));
const catalog = JSON.parse(fs.readFileSync(projectsPath, "utf8"));
const known = new Map(catalog.projects.map(p => [p.id, p]));
for (const { date, data } of dailyDocuments) {
  for (const item of data.projects || []) {
    if (!known.has(item.id)) {
      const added = {
        ...item,
        tags: item.tags || [],
        first_seen: date,
        last_seen: date,
        latest_rank: item.rank || null,
        latest_stars_today: item.stars_today || "",
        latest_analysis_date: date
      };
      delete added.rank;
      delete added.stars_today;
      catalog.projects.push(added);
      known.set(added.id, added);
    }
  }
}
for (const project of catalog.projects) {
  const combined = { ...defaults(project), ...(overrides[project.id] || {}) };
  for (const key of analysisKeys) {
    if (key === "full_analysis") continue;
    if (!usable(project[key])) project[key] = combined[key];
  }
  if (!usable(project.overview)) project.overview = project.description;
  if (!usable(project.full_analysis)) project.full_analysis = buildFull(project);
  project.analysis_scope = "canonical";
  project.analysis_updated_at = updatedAt;
}
catalog.recovery_note = "所有项目使用长期项目库中的 canonical 完整分析；日榜只保留当天排名和 Star 等快照数据，不再使用历史恢复占位说明。";
fs.writeFileSync(projectsPath, JSON.stringify(catalog, null, 2) + "\n", "utf8");

const byId = new Map(catalog.projects.map(p => [p.id, p]));
for (const { filename, data: daily } of dailyDocuments) {
  const fullPath = path.join(dailyDir, filename);
  for (const item of daily.projects || []) {
    const canonical = byId.get(item.id);
    if (!canonical) throw new Error(`${filename}: catalog missing project ${item.id}`);
    for (const key of analysisKeys) item[key] = canonical[key];
    item.analysis_scope = "canonical";
    item.analysis_updated_at = canonical.analysis_updated_at;
  }
  fs.writeFileSync(fullPath, JSON.stringify(daily, null, 2) + "\n", "utf8");
}

const failures = [];
for (const project of catalog.projects) {
  for (const key of analysisKeys) if (!usable(project[key])) failures.push(`${project.id}.${key}`);
}
if (failures.length) throw new Error(`Incomplete canonical analysis: ${failures.join(", ")}`);
console.log(`Canonical analysis synchronized: ${catalog.projects.length} projects, ${analysisKeys.length} required fields.`);
