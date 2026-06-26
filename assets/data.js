"use strict";

window.BatterySafetyData = {
  signals: [
    { key: "warm", title: "运行时轻微温热", desc: "停下高负载任务后很快恢复，没有其他异常", hazard: false, tag: "OBSERVE" },
    { key: "bulge", title: "外壳鼓包或变形", desc: "电池或设备外形已经发生变化", hazard: true, tag: "WARNING" },
    { key: "odor", title: "刺鼻异味或异常声响", desc: "闻到异味，或听见嘶嘶、泄压一类的声音", hazard: true, tag: "WARNING" },
    { key: "hot", title: "停止使用后仍持续发烫", desc: "温度没有回落，反而继续升高", hazard: true, tag: "CRITICAL" },
    { key: "smoke", title: "喷气、冒烟或出现明火", desc: "已经进入紧急危险状态", hazard: true, tag: "EMERGENCY" }
  ],
  scenarios: {
    warm: {
      code: "P3 / Observe",
      score: 12,
      label: "继续观察",
      className: "wrong",
      text: "P3 观察项。边充边看视频温热说明使用方式不理想，应降低负载并改善通风；但若停下后能回落且没有鼓包、异味等，不等同于电池本体异常。"
    },
    bulge: {
      code: "P1 / Immediate Stop",
      score: 30,
      label: "P1 立即停用",
      className: "selected",
      text: "P1 最高优先级。鼓包是电池本体或封装已经异常的直观信号，必须立即停止使用和充电，不挤压、不拆解，并联系规范渠道处理。"
    },
    hall: {
      code: "P2 / Environmental Hazard",
      score: 20,
      label: "P2 环境风险",
      className: "wrong",
      text: "P2 环境与疏散风险。楼道充电会叠加可燃物和逃生通道风险，必须纠正；本题要求识别“电池本体已经异常”，因此鼓包优先级更高。"
    }
  },
  trend: [
    { code: "Stage 01 / Normal Heat", name: "Normal Heat", mark: "✓", title: "保持通风", text: "保持通风，观察温度是否回落。轻微温热可随负载变化出现，但不应被衣物、被褥覆盖。" },
    { code: "Stage 02 / Abnormal Signal", name: "Abnormal Signal", mark: "!", title: "停止使用", text: "停止使用，停止充电。若伴随鼓包、异味、异响或明显发烫，应按异常信号处理。" },
    { code: "Stage 03 / Escalating Risk", name: "Escalating Risk", mark: "!", title: "拉开距离", text: "拉开距离，不搬动、不拆解。停用后仍升温，说明风险未解除，应减少接触并避开可燃物。" },
    { code: "Stage 04 / Smoke or Fire", name: "Smoke or Fire", mark: "×", title: "撤离求助", text: "撤离现场，提醒周围人员避开，并按场所规范和当地应急渠道求助。" }
  ],
  actions: {
    freeze: { score: 2, good: false, mark: "×", title: "不要放进冰箱", reason: "搬动异常电池和不当降温可能带来碰撞、受潮、短路等新风险。", action: "停止使用与充电，隔离可燃物，联系规范处理渠道。" },
    drain: { score: 0, good: false, mark: "×", title: "不要继续使用", reason: "“把电耗完”仍在让异常电池工作，可能继续产热并扩大风险。", action: "立即停止放电和充电，保持距离，不再试探。" },
    safe: { score: 30, good: true, mark: "✓", title: "正确：先停用，再避险", reason: "异常电池应先停止能量输入和继续工作，避免人员靠近和可燃物暴露。", action: "STOP 停止使用与充电；DISTANCE 远离人员与可燃物；REPORT 联系规范处理渠道。" },
    pierce: { score: 0, good: false, mark: "×", title: "不要拆、刺、压", reason: "刺破或挤压可能损坏内部结构，引发短路、泄漏或突然失稳。", action: "不要自行修复，转交厂家、社区、学校或规范回收/应急渠道。" }
  },
  sources: [
    { type: "政府文件", title: "《电动自行车用锂离子电池健康评估工作指引》", org: "工业和信息化部、国家市场监督管理总局、国家消防救援局 / 中国政府网", year: "2024", use: "用于健康评估、异常状态识别和规范处置原则参考。", url: "https://www.gov.cn/zhengce/zhengceku/202412/content_6992346.htm" },
    { type: "政府指南", title: "《电动自行车锂离子电池回收利用体系建设指南》", org: "全国电动自行车安全隐患全链条整治工作专班 / 中国政府网", year: "2025", use: "用于规范回收、转交和渠道化处置表述参考。", url: "https://www.gov.cn/zhengce/202501/content_7001033.htm" },
    { type: "消防科普", title: "《电动车起火真的可怕 这些错误不要犯》", org: "国家消防救援局 / 中国消防", year: "2025", use: "用于楼道充电、起火风险和公众消防提醒参考。", url: "https://www.119.gov.cn/kp/hzyf/jtgj/2025/51373.shtml" },
    { type: "产品说明", title: "《iPhone 的重要安全性信息》", org: "Apple iPhone 使用手册", year: "持续更新", use: "用于消费电子设备安全使用、异常状态避免继续使用的表述参考。", url: "https://support.apple.com/zh-cn/guide/iphone/iph301fc905/ios" },
    { type: "综述论文", title: "Thermal runaway mechanism of lithium ion battery for electric vehicles: A review", org: "Energy Storage Materials", year: "2018", use: "用于热失控机理、触发因素和链式反应描述参考。", url: "https://doi.org/10.1016/j.ensm.2017.05.013" },
    { type: "综述论文", title: "A review of lithium ion battery failure mechanisms and fire prevention strategies", org: "Progress in Energy and Combustion Science", year: "2019", use: "用于失效机制、火灾预防策略和风险传播逻辑参考。", url: "https://doi.org/10.1016/j.pecs.2019.03.002" }
  ]
};
