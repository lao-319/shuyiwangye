import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MED_COLORS, GeoIcons } from '../../constants';

// ============================================================
// 科幻电子档案 — 分页文档组件
// 模拟军用/医疗终端中的加密电子记录文档
// 配色：蓝-白-灰 单色系统
// 内容来源：WHO 鼠疫事实档案 (2024)
// ============================================================

interface DocPage {
  id: string;
  title: string;
  subtitle?: string;
  renderContent: () => React.ReactNode;
}

const CHAMFER_CLIP = `polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)`;

// ============================================================
// 小型 UI 组件 — 统一蓝白灰配色
// ============================================================

const DataRow: React.FC<{
  label: string;
  value: string;
  emphasis?: boolean;
}> = ({ label, value, emphasis }) => (
  <div
    className="flex border-b py-1.5 px-1 text-[11px]"
    style={{ borderColor: MED_COLORS.GRAY_DARK }}
  >
    <span
      className="w-[42%] flex-shrink-0 uppercase tracking-wider opacity-60"
      style={{ color: MED_COLORS.GRAY_LIGHT }}
    >
      {label}
    </span>
    <span
      className="flex-1 font-mono"
      style={{
        color: emphasis ? MED_COLORS.BLUE : MED_COLORS.TEXT,
        fontWeight: emphasis ? 700 : 400,
      }}
    >
      {value}
    </span>
  </div>
);

const InfoBlock: React.FC<{
  title: string;
  children: React.ReactNode;
}> = ({ title, children }) => (
  <div className="mb-2.5">
    <div className="flex items-center gap-1.5 mb-1">
      <div className="w-1 h-3" style={{ backgroundColor: MED_COLORS.BLUE }} />
      <span
        className="text-[11px] font-bold uppercase tracking-wider"
        style={{ color: MED_COLORS.BLUE }}
      >
        {title}
      </span>
    </div>
    <div
      className="text-[10px] leading-relaxed pl-2.5"
      style={{ color: MED_COLORS.TEXT }}
    >
      {children}
    </div>
  </div>
);

const TypePill: React.FC<{
  label: string;
  sub: string;
  active?: boolean;
}> = ({ label, sub, active = true }) => (
  <div
    className="text-center py-1.5 rounded border"
    style={{
      borderColor: active ? MED_COLORS.BLUE : MED_COLORS.GRAY_MID,
      backgroundColor: active ? `${MED_COLORS.BLUE}08` : 'transparent',
    }}
  >
    <div
      className="text-[10px] font-bold"
      style={{ color: active ? MED_COLORS.BLUE : MED_COLORS.GRAY_LIGHT }}
    >
      {label}
    </div>
    <div
      className="text-[8px] uppercase opacity-50"
      style={{ color: MED_COLORS.GRAY_LIGHT }}
    >
      {sub}
    </div>
  </div>
);

const Footnote: React.FC<{ text: string }> = ({ text }) => (
  <div
    className="text-[9px] mt-2 pt-1 border-t opacity-40 uppercase"
    style={{ borderColor: MED_COLORS.GRAY_MID, color: MED_COLORS.GRAY_LIGHT }}
  >
    {text}
  </div>
);

const StepItem: React.FC<{ step: string; label: string; desc: string }> = ({ step, label, desc }) => (
  <div className="flex gap-2 text-[11px]">
    <span className="font-mono font-bold flex-shrink-0" style={{ color: MED_COLORS.BLUE }}>{step}</span>
    <span className="font-bold flex-shrink-0 w-[56px]" style={{ color: MED_COLORS.TEXT }}>{label}</span>
    <span style={{ color: MED_COLORS.GRAY_LIGHT }}>{desc}</span>
  </div>
);

const AntibioticItem: React.FC<{ label: string; sub: string }> = ({ label, sub }) => (
  <div className="flex items-center gap-2 text-[11px]">
    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: MED_COLORS.BLUE }} />
    <span className="font-bold w-[72px]" style={{ color: MED_COLORS.BLUE }}>{label}</span>
    <span style={{ color: MED_COLORS.GRAY_LIGHT }}>{sub}</span>
  </div>
);

const AlertBox: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    className="border p-2 text-[10px] uppercase tracking-wider font-bold"
    style={{
      borderColor: MED_COLORS.BLUE,
      color: MED_COLORS.BLUE,
      backgroundColor: `${MED_COLORS.BLUE}08`,
    }}
  >
    {children}
  </div>
);

const ScanLineSVG: React.FC = () => (
  <svg
    className="absolute inset-0 pointer-events-none"
    width="100%" height="100%"
    style={{ zIndex: 5 }}
  >
    <defs>
      <pattern id="scan-h" patternUnits="userSpaceOnUse" width="100%" height="4">
        <rect width="100%" height="1" fill={MED_COLORS.BLUE} opacity="0.03" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#scan-h)" />
  </svg>
);

const ClassificationStamp: React.FC<{ level: string }> = ({ level }) => (
  <div className="absolute bottom-3 left-3 pointer-events-none" style={{ zIndex: 6 }}>
    <div
      className="text-[8px] font-bold uppercase tracking-[0.2em] border px-2 py-0.5"
      style={{
        color: MED_COLORS.BLUE,
        borderColor: MED_COLORS.BLUE,
        opacity: 0.6,
        fontFamily: "'JetBrains Mono','SimHei',monospace",
      }}
    >
      ▮ {level}
    </div>
  </div>
);

// ============================================================
// 主组件
// ============================================================
interface PaginatedDocProps {
  visible: boolean;
  onClose: () => void;
}

const PaginatedDoc: React.FC<PaginatedDocProps> = ({ visible, onClose }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const currentPageRef = useRef(currentPage);
  currentPageRef.current = currentPage;

  const goToPage = useCallback(
    (page: number) => {
      if (page < 0 || page >= pages.length) return;
      setDirection(page > currentPageRef.current ? 'forward' : 'backward');
      setCurrentPage(page);
    },
    [],
  );

  useEffect(() => {
    if (!visible) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        goToPage(currentPageRef.current + 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        goToPage(currentPageRef.current - 1);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [visible, goToPage, onClose]);

  useEffect(() => {
    if (visible) setCurrentPage(0);
  }, [visible]);

  // ============================================================
  // 强调文字辅助（蓝色 + 加粗）
  // ============================================================
  const Em = ({ children }: { children: React.ReactNode }) => (
    <span style={{ color: MED_COLORS.BLUE, fontWeight: 700 }}>{children}</span>
  );

  // ============================================================
  // 页码列表
  // ============================================================
  const pages: DocPage[] = [
    // ============================================================
    // 封面页
    // ============================================================
    {
      id: 'cover',
      title: '鼠疫',
      subtitle: 'PLAGUE · YERSINIA PESTIS',
      renderContent: () => (
        <div className="flex flex-col items-center justify-center h-full space-y-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
            className="flex items-center justify-center"
            style={{
              width: 64,
              height: 64,
              border: `2px solid ${MED_COLORS.BLUE}`,
              borderRadius: '50%',
              boxShadow: `0 0 30px ${MED_COLORS.BLUE}40`,
            }}
          >
            <GeoIcons.Biohazard />
          </motion.div>

          <div className="text-center space-y-1">
            <div
              className="text-[10px] uppercase tracking-[0.2em] opacity-50"
              style={{ color: MED_COLORS.BLUE }}
            >
              WORLD HEALTH ORGANIZATION
            </div>
            <h1
              className="text-xl font-bold tracking-tight"
              style={{
                color: MED_COLORS.TEXT,
                fontFamily: "'JetBrains Mono','SimHei',monospace",
              }}
            >
              鼠疫 · 重要事实档案
            </h1>
            <div
              className="text-[10px] uppercase tracking-wider"
              style={{ color: MED_COLORS.BLUE, opacity: 0.7 }}
            >
              Plague Fact Sheet
            </div>
          </div>

          <div className="flex items-center gap-2 w-48">
            <div className="flex-1 h-px" style={{ backgroundColor: MED_COLORS.BLUE, opacity: 0.3 }} />
            <span className="text-[8px] uppercase" style={{ color: MED_COLORS.BLUE, opacity: 0.6 }}>
              CLASSIFIED
            </span>
            <div className="flex-1 h-px" style={{ backgroundColor: MED_COLORS.BLUE, opacity: 0.3 }} />
          </div>

          <div className="space-y-1 text-center">
            <DataRow label="档案编号" value="WHO-EPI-2024-014" />
            <DataRow label="发布机构" value="世界卫生组织 (WHO)" />
            <DataRow label="最后更新" value="2024.09.24" />
            <DataRow label="生物安全等级" value="BSL-3 // BIOSAFETY" emphasis />
            <DataRow label="病原体" value="Yersinia pestis" emphasis />
            <DataRow label="文档页码" value="共 8 页" />
          </div>
        </div>
      ),
    },

    // ============================================================
    // 第 1 页：重要事实
    // ============================================================
    {
      id: 'facts',
      title: '重要事实',
      subtitle: 'KEY FACTS — 鼠疫核心数据',
      renderContent: () => (
        <div className="space-y-3">
          <InfoBlock title="病原体">
            鼠疫耶尔森菌（<Em>Yersinia pestis</Em>），一种动物源性细菌。通常可在小哺乳动物及其跳蚤上发现。
          </InfoBlock>

          <InfoBlock title="潜伏期">
            感染后通常 <Em>1-7 天</Em> 出现症状。肺鼠疫潜伏期可短至 24 小时。
          </InfoBlock>

          <InfoBlock title="三种主要临床形式">
            <div className="grid grid-cols-3 gap-1.5 mt-1">
              <TypePill label="腺鼠疫" sub="Bubonic" />
              <TypePill label="肺鼠疫" sub="Pneumonic" />
              <TypePill label="败血型" sub="Septicemic" />
            </div>
          </InfoBlock>

          <InfoBlock title="传播途径">
            染病跳蚤叮咬、接触受感染的组织/体液、吸入肺鼠疫患者呼吸道飞沫/微粒。肺鼠疫是唯一可<Em>人传人</Em>的形式。
          </InfoBlock>

          <InfoBlock title="病死率">
            <div className="space-y-0.5">
              <div>腺鼠疫未治疗：<Em>30% – 60%</Em></div>
              <div>肺鼠疫未治疗：<Em>接近 100%</Em>（发病 18-24 小时内致命）</div>
            </div>
          </InfoBlock>

          <InfoBlock title="流行最广国家">
            刚果民主共和国、马达加斯加、秘鲁。近年来，鼠疫在非洲和南美洲部分地区呈地方性流行。
          </InfoBlock>

          <Footnote text="* 数据来源：WHO Fact Sheet — Plague, 2024 版" />
        </div>
      ),
    },

    // ============================================================
    // 第 2 页：体征和症状
    // ============================================================
    {
      id: 'symptoms',
      title: '体征和症状',
      subtitle: 'SIGNS & SYMPTOMS — 三种临床分型详解',
      renderContent: () => (
        <div className="space-y-3">
          <InfoBlock title="急性发病特征">
            感染后 1-7 天出现<Em>急性发烧</Em>及非特异性全身症状：
          </InfoBlock>

          <div className="grid grid-cols-3 gap-1.5">
            {['突然发烧', '寒战', '头痛', '身体疼痛', '虚弱乏力', '呕吐恶心'].map(s => (
              <div
                key={s}
                className="text-center py-1.5 rounded border text-[10px] font-bold"
                style={{
                  borderColor: `${MED_COLORS.BLUE}30`,
                  color: MED_COLORS.BLUE,
                }}
              >
                {s}
              </div>
            ))}
          </div>

          <div className="border-t pt-2 mt-2" style={{ borderColor: MED_COLORS.GRAY_DARK }} />

          <InfoBlock title="腺鼠疫">
            <span style={{ fontWeight: 700 }}>最常见形式。</span>跳蚤叮咬引起。特征为淋巴结肿大、疼痛、发炎（淋巴结炎），后期可化脓溃烂。肿大淋巴结被称为<Em>"腹股沟淋巴结炎"</Em>。
          </InfoBlock>

          <InfoBlock title="肺鼠疫">
            <span style={{ fontWeight: 700 }}>最凶险形式。</span>潜伏期可短至 24 小时。通常由腺鼠疫后期细菌扩散至肺部引起。<Em>通过飞沫在人与人之间传播</Em>，传染性极强。
          </InfoBlock>

          <InfoBlock title="败血性鼠疫">
            细菌直接进入血液引起全身感染。可导致<Em>败血症休克</Em>和多器官衰竭。可原发也可由其他两型发展而来。
          </InfoBlock>
        </div>
      ),
    },

    // ============================================================
    // 第 3 页：诊断
    // ============================================================
    {
      id: 'diagnosis',
      title: '诊断',
      subtitle: 'DIAGNOSIS — 实验室确诊流程',
      renderContent: () => (
        <div className="space-y-3">
          <InfoBlock title="确诊方法">
            鼠疫确诊<Em>必须通过实验室检测</Em>。从患者身上采集样本（淋巴结脓液、血液或痰液）检测鼠疫耶尔森菌的存在。
          </InfoBlock>

          <div className="border p-2 space-y-1.5" style={{ borderColor: MED_COLORS.BLUE }}>
            <div className="text-[9px] uppercase tracking-wider mb-1.5" style={{ color: MED_COLORS.BLUE }}>
              ▸ 诊断检测流程
            </div>
            <div className="space-y-1">
              <StepItem step="01" label="样本采集" desc="淋巴结穿刺脓液 / 血液培养 / 痰液标本" />
              <StepItem step="02" label="细菌培养" desc="血琼脂培养基，28°C 培养 24-48 小时" />
              <StepItem step="03" label="革兰氏染色" desc="革兰氏阴性球杆菌，双极浓染（安全别针形态）" />
              <StepItem step="04" label="血清学检测" desc="F1 抗原检测 / 抗 F1 抗体 ELISA" />
              <StepItem step="05" label="PCR 确认" desc="靶向 pla 和 caf1 基因进行 PCR 扩增" />
            </div>
          </div>

          <InfoBlock title="快速诊断检测 (RDT)">
            <Em>2024 年重大更新：</Em>WHO 支持在非洲和南美洲推广<Em>快速试纸检测技术</Em>。2024 年新指南详细说明了在不同流行病学情景下使用快速诊断检测的建议。
          </InfoBlock>

          <InfoBlock title="鉴别诊断">
            需与土拉菌病（兔热病）、猫抓病、链球菌淋巴结炎、钩端螺旋体病等相鉴别。肺鼠疫需与社区获得性肺炎相鉴别。
          </InfoBlock>
        </div>
      ),
    },

    // ============================================================
    // 第 4 页：治疗
    // ============================================================
    {
      id: 'treatment',
      title: '治疗',
      subtitle: 'TREATMENT — 抗生素与支持治疗',
      renderContent: () => (
        <div className="space-y-3">
          <AlertBox>⚠ 关键原则：及早诊断和治疗是挽救生命的关键</AlertBox>

          <InfoBlock title="主要治疗手段">
            <Em>抗生素 + 支持性疗法。</Em>针对革兰氏阴性杆菌的常见抗生素有效。治疗应在临床诊断后立即开始，无需等待实验室确认。
          </InfoBlock>

          <InfoBlock title="2024 年推荐抗生素">
            <div className="space-y-1 mt-1">
              <AntibioticItem label="氟喹诺酮类" sub="2024 年新增为一线选择" />
              <AntibioticItem label="链霉素" sub="经典一线药物（肌注）" />
              <AntibioticItem label="庆大霉素" sub="替代链霉素的首选（静脉）" />
              <AntibioticItem label="多西环素" sub="口服/静脉，暴露后预防" />
              <AntibioticItem label="氯霉素" sub="脑膜炎型鼠疫首选" />
            </div>
          </InfoBlock>

          <InfoBlock title="治疗时机">
            肺鼠疫若不及时治疗，发病后<Em> 18-24 小时 </Em>内可致命。腺鼠疫治疗窗口期为症状出现后<Em> 48 小时 </Em>。
          </InfoBlock>

          <InfoBlock title="支持治疗">
            包括补液、血管活性药物（败血性休克时）、呼吸支持（肺鼠疫）、引流化脓淋巴结等综合 ICU 支持手段。
          </InfoBlock>
        </div>
      ),
    },

    // ============================================================
    // 第 5 页：预防
    // ============================================================
    {
      id: 'prevention',
      title: '预防',
      subtitle: 'PREVENTION — 多层次防控措施',
      renderContent: () => (
        <div className="space-y-3">
          <InfoBlock title="环境防控 — 第 1 层">
            在动物源性鼠疫活跃地区，向公众发布预警信息。开展媒介和宿主监测，及时发现动物间鼠疫流行信号。
          </InfoBlock>

          <InfoBlock title="个人防护 — 第 2 层">
            <div className="space-y-1">
              <div>· 使用含 DEET 的驱虫剂，防止跳蚤叮咬</div>
              <div>· 不接触/不处理动物尸体（尤其啮齿类）</div>
              <div>· 避免直接接触受感染的体液和组织</div>
              <div>· 在疫区户外活动时穿长袖长裤</div>
            </div>
          </InfoBlock>

          <div
            className="border p-2"
            style={{
              borderColor: MED_COLORS.BLUE,
              backgroundColor: `${MED_COLORS.BLUE}06`,
            }}
          >
            <div className="text-[10px] uppercase tracking-wider font-bold mb-1" style={{ color: MED_COLORS.BLUE }}>
              ⚠ 灭蚤灭鼠顺序 — 绝不能颠倒！
            </div>
            <div className="text-[11px]" style={{ color: MED_COLORS.TEXT }}>
              必须先<Em>灭跳蚤</Em>再灭鼠。如果先灭鼠，跳蚤会离开死鼠身体跳到新的宿主（包括人类）身上，反而加速疫情传播。
            </div>
          </div>

          <InfoBlock title="医务人员防护 — 第 3 层">
            处理患者和样本时采取标准预防措施。肺鼠疫患者需<Em>隔离治疗</Em>，医护人员佩戴 N95 口罩、护目镜、手套和隔离衣。
          </InfoBlock>

          <InfoBlock title="2024 年更新">
            2024 年手册更新了处理鼠疫感染尸体时的<Em>个人防护装备方案</Em>，加强了安全标准。
          </InfoBlock>
        </div>
      ),
    },

    // ============================================================
    // 第 6 页：疫苗接种 + 疫情管理
    // ============================================================
    {
      id: 'vaccination',
      title: '疫苗接种',
      subtitle: 'VACCINATION — 适用人群与建议',
      renderContent: () => (
        <div className="space-y-3">
          <div
            className="border p-2 text-[10px] font-bold text-center"
            style={{
              borderColor: MED_COLORS.BLUE,
              color: MED_COLORS.BLUE,
              backgroundColor: `${MED_COLORS.BLUE}08`,
            }}
          >
            WHO 不建议普遍接种鼠疫疫苗
          </div>

          <InfoBlock title="仅推荐高危人群接种">
            <div className="space-y-1 mt-1">
              <div className="flex gap-2 items-start">
                <span style={{ color: MED_COLORS.BLUE }}>▸</span>
                <span>
                  <Em>实验室人员</Em>{' '}— 经常暴露在高浓度鼠疫耶尔森菌感染风险下
                </span>
              </div>
              <div className="flex gap-2 items-start">
                <span style={{ color: MED_COLORS.BLUE }}>▸</span>
                <span>
                  <Em>卫生工作者</Em>{' '}— 直接接触鼠疫患者（尤其是肺鼠疫患者）
                </span>
              </div>
            </div>
          </InfoBlock>

          <InfoBlock title="疫苗类型">
            目前使用的鼠疫疫苗为灭活全菌体疫苗，保护效力有限。新型重组亚单位疫苗（基于 F1 和 V 抗原）正在研发中，有望提供更好的保护效果。
          </InfoBlock>

          <div className="border-t pt-2" style={{ borderColor: MED_COLORS.GRAY_DARK }} />

          <InfoBlock title="鼠疫疫情的管理">
            <div className="space-y-1 mt-1">
              <div className="text-[11px]" style={{ color: MED_COLORS.TEXT }}>
                <span style={{ fontWeight: 700, color: MED_COLORS.BLUE }}>1. 快速检测与报告：</span>
                疑似病例立即上报当地卫生部门，启动应急响应。
              </div>
              <div className="text-[11px]" style={{ color: MED_COLORS.TEXT }}>
                <span style={{ fontWeight: 700, color: MED_COLORS.BLUE }}>2. 隔离患者：</span>
                肺鼠疫患者必须隔离至有效抗生素治疗 48 小时后。
              </div>
              <div className="text-[11px]" style={{ color: MED_COLORS.TEXT }}>
                <span style={{ fontWeight: 700, color: MED_COLORS.BLUE }}>3. 接触者追踪：</span>
                识别并评估所有密切接触者，给予预防性抗生素。
              </div>
              <div className="text-[11px]" style={{ color: MED_COLORS.TEXT }}>
                <span style={{ fontWeight: 700, color: MED_COLORS.BLUE }}>4. 媒介控制：</span>
                在疫区实施灭蚤和灭鼠，顺序必须为先灭蚤后灭鼠。
              </div>
              <div className="text-[11px]" style={{ color: MED_COLORS.TEXT }}>
                <span style={{ fontWeight: 700, color: MED_COLORS.BLUE }}>5. 社区教育：</span>
                向公众宣传鼠疫传播方式、症状识别和防护措施。
              </div>
            </div>
          </InfoBlock>
        </div>
      ),
    },

    // ============================================================
    // 第 7 页：监测与控制 + 参考来源
    // ============================================================
    {
      id: 'surveillance',
      title: '监测和控制',
      subtitle: 'SURVEILLANCE & CONTROL — 全球监测网络',
      renderContent: () => (
        <div className="space-y-3">
          <InfoBlock title="监测体系">
            WHO 与各成员国合作建立鼠疫监测网络，重点关注非洲和南美洲的地方性流行区域。监测内容包括动物宿主密度、跳蚤指数、动物间鼠疫流行率等。
          </InfoBlock>

          <InfoBlock title="2024 年手册主要更新">
            <div className="space-y-1.5 mt-1">
              {[
                '快速诊断检测在不同流行病学情景下的应用指南',
                '氟喹诺酮类作为一线治疗选择的推荐',
                '更新感染尸体处理的个人防护装备方案',
                '加强全球卫生应急准备和应对能力建设',
              ].map((t, i) => (
                <div key={i} className="flex gap-2 text-[11px]">
                  <span className="font-mono font-bold flex-shrink-0" style={{ color: MED_COLORS.BLUE }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span style={{ color: MED_COLORS.TEXT }}>{t}</span>
                </div>
              ))}
            </div>
          </InfoBlock>

          <div className="border-t pt-2" style={{ borderColor: MED_COLORS.GRAY_DARK }} />

          <InfoBlock title="全球疫情分布">
            鼠疫在历史上引发了三次世界性大流行：<Em>查士丁尼瘟疫</Em>（6 世纪）、<Em>黑死病</Em>（14 世纪）和<Em>第三次大流行</Em>（19 世纪末-20 世纪初）。现今鼠疫在非洲、亚洲和美洲的多个国家呈地方性流行。
          </InfoBlock>

          <div className="border-t pt-2 mt-3" style={{ borderColor: MED_COLORS.GRAY_DARK }} />

          <div className="space-y-1">
            <div
              className="text-[9px] uppercase tracking-wider mb-1"
              style={{ color: MED_COLORS.BLUE }}
            >
              ▸ 参考来源
            </div>
            <div className="text-[9px] space-y-0.5" style={{ color: MED_COLORS.GRAY_LIGHT }}>
              <div>
                [1] WHO Fact Sheet — Plague.{' '}
                <span style={{ color: MED_COLORS.BLUE }}>who.int/zh/news-room/fact-sheets/detail/plague</span>
              </div>
              <div>[2] WHO 鼠疫监测、诊断、预防和控制手册 (2024-09-24)</div>
              <div>[3] WHO 第 75 届世界卫生大会 — 关于加强全球卫生应急准备和应对的建议</div>
              <div>[4] PESTIS Terminal v4.1-MED — 鼠疫历史数据集 (Liu & Gong 2025; Büntgen et al. 2012)</div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const page = pages[currentPage];
  if (!page) return null;

  const isFirst = currentPage === 0;
  const isLast = currentPage === pages.length - 1;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[500] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* 暗色遮罩 */}
          <div
            className="absolute inset-0"
            style={{ backgroundColor: 'rgba(15,23,42,0.75)', backdropFilter: 'blur(4px)' }}
            onClick={onClose}
          />

          {/* 扫描光束 */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `linear-gradient(to bottom, transparent 0%, ${MED_COLORS.BLUE}03 45%, ${MED_COLORS.BLUE}06 50%, ${MED_COLORS.BLUE}03 55%, transparent 100%)`,
              zIndex: 1,
            }}
          />

          {/* ============================================================ */}
          {/* 文档容器 */}
          {/* ============================================================ */}
          <motion.div
            className="relative"
            initial={{ scale: 0.85, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.85, y: 20 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            style={{ width: 520, height: 620, zIndex: 2 }}
          >
            {/* 外部发光 */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                borderRadius: '5px',
                boxShadow: `0 0 40px ${MED_COLORS.BLUE}15, 0 0 80px ${MED_COLORS.BLUE}08`,
              }}
            />

            {/* 文档主体 */}
            <div className="relative w-full h-full overflow-hidden" style={{ borderRadius: '5px' }}>
              {/* 背景 */}
              <div
                className="absolute inset-0"
                style={{
                  backgroundColor: 'rgba(248,250,252,0.98)',
                  backdropFilter: 'blur(20px)',
                  clipPath: CHAMFER_CLIP,
                }}
              />

              {/* 网格纸背景 */}
              <div
                className="absolute inset-0"
                style={{
                  clipPath: CHAMFER_CLIP,
                  backgroundImage: `
                    linear-gradient(${MED_COLORS.GRAY_DARK} 1px, transparent 1px),
                    linear-gradient(90deg, ${MED_COLORS.GRAY_DARK} 1px, transparent 1px)
                  `,
                  backgroundSize: '20px 20px',
                  backgroundPosition: '-1px -1px',
                  opacity: 0.35,
                  zIndex: 0,
                }}
              />

              {/* 蓝色边界线 */}
              <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1, clipPath: CHAMFER_CLIP }}>
                <div
                  className="absolute top-0 left-3 h-full w-px"
                  style={{ backgroundColor: MED_COLORS.BLUE, opacity: 0.1 }}
                />
                <div
                  className="absolute top-0 right-3 h-full w-px"
                  style={{ backgroundColor: MED_COLORS.BLUE, opacity: 0.1 }}
                />
              </div>

              <ScanLineSVG />

              {/* 切角边框 */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  zIndex: 10,
                  clipPath: CHAMFER_CLIP,
                  border: `1px solid ${MED_COLORS.BLUE}40`,
                  boxShadow: `inset 0 0 0 1px ${MED_COLORS.BLUE}20`,
                  borderRadius: '5px',
                }}
              />

              {/* ============================================================ */}
              {/* 页面内容 */}
              {/* ============================================================ */}
              <div className="relative flex flex-col h-full" style={{ zIndex: 3, padding: '28px 32px 20px' }}>
                {/* 页眉 */}
                <div
                  className="flex items-center justify-between border-b pb-2 mb-3 flex-shrink-0"
                  style={{ borderColor: MED_COLORS.GRAY_DARK }}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor: MED_COLORS.BLUE,
                        boxShadow: `0 0 4px ${MED_COLORS.BLUE}`,
                      }}
                    />
                    <span
                      className="text-[11px] font-bold uppercase tracking-wider"
                      style={{ color: MED_COLORS.BLUE }}
                    >
                      {page.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px]">
                    <span style={{ color: MED_COLORS.GRAY_LIGHT, opacity: 0.6 }}>
                      {currentPage + 1} / {pages.length}
                    </span>
                    <span
                      className="uppercase tracking-wider"
                      style={{ color: MED_COLORS.BLUE, opacity: 0.45 }}
                    >
                      WHO CONFIDENTIAL
                    </span>
                  </div>
                </div>

                {/* 副标题 */}
                {page.subtitle && (
                  <div
                    className="text-[9px] uppercase tracking-[0.15em] mb-3 flex-shrink-0"
                    style={{
                      color: MED_COLORS.GRAY_LIGHT,
                      opacity: 0.5,
                      fontFamily: "'JetBrains Mono','SimHei',monospace",
                    }}
                  >
                    {page.subtitle}
                  </div>
                )}

                {/* 内容区域 */}
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={page.id}
                    className="flex-1 overflow-y-auto overflow-x-hidden"
                    style={{ scrollbarWidth: 'thin', scrollbarColor: `${MED_COLORS.BLUE}40 transparent` }}
                    initial={{ opacity: 0, x: direction === 'forward' ? 40 : -40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: direction === 'forward' ? -40 : 40 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                  >
                    {page.renderContent()}
                  </motion.div>
                </AnimatePresence>

                <ClassificationStamp
                  level={page.id === 'cover' ? 'WHO RESTRICTED' : 'WHO-EPI-2024 // BSL-3'}
                />
              </div>
            </div>

            {/* 翻页按钮 */}
            {!isFirst && (
              <button
                onClick={() => goToPage(currentPage - 1)}
                className="absolute -left-12 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center transition-all"
                style={{ width: 36, height: 36, color: MED_COLORS.BLUE, opacity: 0.7 }}
                title="上一页 (← 键)"
              >
                <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
            )}
            {!isLast && (
              <button
                onClick={() => goToPage(currentPage + 1)}
                className="absolute -right-12 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center transition-all"
                style={{ width: 36, height: 36, color: MED_COLORS.BLUE, opacity: 0.7 }}
                title="下一页 (→ 键)"
              >
                <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            )}

            {/* 页面指示器 */}
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
              {pages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i)}
                  className="transition-all"
                  style={{
                    width: i === currentPage ? 18 : 7,
                    height: 7,
                    borderRadius: '2px',
                    backgroundColor: i === currentPage ? MED_COLORS.BLUE : MED_COLORS.GRAY_MID,
                    boxShadow: i === currentPage ? `0 0 6px ${MED_COLORS.BLUE}60` : 'none',
                    opacity: i === currentPage ? 1 : 0.5,
                  }}
                  title={pages[i].title}
                />
              ))}
            </div>

            {/* 关闭按钮 */}
            <button
              onClick={onClose}
              className="absolute -top-3 -right-3 z-30 flex items-center justify-center transition-all hover:scale-110"
              style={{
                width: 28, height: 28, borderRadius: '50%',
                backgroundColor: MED_COLORS.BLUE, color: '#FFFFFF',
                boxShadow: `0 0 12px ${MED_COLORS.BLUE}50`,
                fontSize: '14px',
              }}
              title="关闭 (ESC 键)"
            >
              ✕
            </button>

            {/* 键盘提示 */}
            <div
              className="absolute -bottom-10 right-0 text-[8px] uppercase tracking-wider opacity-30"
              style={{ color: MED_COLORS.GRAY_LIGHT, fontFamily: "'JetBrains Mono',monospace" }}
            >
              ← → 翻页 · ESC 关闭
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PaginatedDoc;
