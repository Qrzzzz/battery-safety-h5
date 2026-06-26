"use strict";

window.BatterySafetyData = {
  signals: [
    { key: "warm", title: "运行时轻微温热", desc: "停止高负载后很快恢复，没有其他异常", hazard: false, tag: "继续观察" },
    { key: "bulge", title: "外壳鼓包或变形", desc: "电池或设备外形已经发生变化", hazard: true, tag: "需要警惕" },
    { key: "odor", title: "刺鼻异味或异常声响", desc: "闻到异味，或听见嘶嘶、泄压一类的声音", hazard: true, tag: "需要警惕" },
    { key: "hot", title: "停止使用后仍持续发烫", desc: "温度没有回落，反而继续升高", hazard: true, tag: "高度危险" },
    { key: "smoke", title: "喷气、冒烟或出现明火", desc: "已经进入紧急危险状态", hazard: true, tag: "高度危险" }
  ],
  scenarios: {
    warm: { score: 12, label: "继续观察", className: "wrong", text: "这不是最紧急的一项。机身温热需要改善使用方式，但如果停止高负载后能够降温，也没有其他异常，通常不等同于电池本体已经失稳。" },
    bulge: { score: 30, label: "立即停用", className: "selected", text: "正确。鼓包说明电池或设备外形已经异常。不要继续使用、充电、挤压或拆解，应通过厂家、学校、社区或规范回收渠道处理。" },
    hall: { score: 20, label: "环境风险", className: "wrong", text: "楼道充电确实危险，尤其会影响疏散，还可能叠加可燃物风险。但本题问的是“电池本体已经异常”，鼓包更需要马上停用。" }
  },
  trend: [
    { code: "阶段 1", name: "正常温热", mark: "✓", title: "正常温热", text: "使用或充电时轻微温热并不少见。保持通风，不要用被褥、衣物盖住设备。" },
    { code: "阶段 2", name: "出现异常", mark: "!", title: "出现异常", text: "明显发烫，或者伴随鼓包、异味、异响，就不该继续充电或运行。" },
    { code: "阶段 3", name: "持续升温", mark: "!", title: "持续升温", text: "停用后温度仍在上升，说明风险没有解除。减少接触，不要搬动、拆解或尝试修复。" },
    { code: "阶段 4", name: "烟气或明火", mark: "×", title: "烟气或明火", text: "立即远离现场，提醒周围人员避开；按照场所规定和当地应急要求求助。" }
  ],
  actions: {
    freeze: { score: 2, good: false, mark: "×", title: "不要放进冰箱", reason: "搬动异常电池和不当降温都可能带来新的碰撞、受潮或短路风险。", action: "停止使用与充电，人员保持距离，联系规范处理渠道。" },
    drain: { score: 0, good: false, mark: "×", title: "不要继续使用", reason: "“把电用完”仍在让异常电池工作，可能让产热继续增加。", action: "立即停止放电和充电，保持距离，不再试探。" },
    safe: { score: 30, good: true, mark: "✓", title: "正确", reason: "先停止使用和充电，人员保持距离，避开可燃物。", action: "再联系学校、社区、厂家、消防或规范回收渠道。" },
    pierce: { score: 0, good: false, mark: "×", title: "不要拆、刺、压", reason: "这些动作可能损坏内部结构，引发短路、泄漏或突然失稳。", action: "不要自行修复，转交厂家、社区、学校或规范回收渠道。" }
  },
  sources: [
    { type: "政府文件", title: "《电动自行车用锂离子电池健康评估工作指引》", org: "工业和信息化部、国家市场监督管理总局、国家消防救援局", year: "2024", use: "用于健康评估和风险提示依据。", url: "https://www.gov.cn/zhengce/zhengceku/202412/content_6992346.htm" },
    { type: "政府指南", title: "《电动自行车锂离子电池回收利用体系建设指南》", org: "全国电动自行车安全隐患全链条整治工作专班 / 中国政府网", year: "2025", use: "用于规范回收、转交和渠道化处置表述参考。", url: "https://www.gov.cn/zhengce/202501/content_7001033.htm" },
    { type: "消防科普", title: "《电动车起火真的可怕 这些错误不要犯》", org: "国家消防救援局 / 中国消防", year: "2025", use: "用于楼道充电、起火风险和公众消防提醒参考。", url: "https://www.119.gov.cn/kp/hzyf/jtgj/2025/51373.shtml" },
    { type: "产品说明", title: "《iPhone 的重要安全性信息》", org: "Apple iPhone 使用手册", year: "持续更新", use: "用于消费电子设备安全使用、异常状态避免继续使用的表述参考。", url: "https://support.apple.com/zh-cn/guide/iphone/iph301fc905/ios" },
    { type: "综述论文", title: "Thermal runaway mechanism of lithium ion battery for electric vehicles: A review", org: "Energy Storage Materials", year: "2018", use: "用于热失控机理、触发因素和链式反应描述参考。", url: "https://doi.org/10.1016/j.ensm.2017.05.013" },
    { type: "综述论文", title: "A review of lithium ion battery failure mechanisms and fire prevention strategies", org: "Progress in Energy and Combustion Science", year: "2019", use: "用于失效机制、火灾预防策略和风险传播逻辑参考。", url: "https://doi.org/10.1016/j.pecs.2019.03.002" }
  ]
};
