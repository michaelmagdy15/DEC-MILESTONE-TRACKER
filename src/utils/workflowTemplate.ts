export interface WorkflowPhase {
    name: string;
    tasks: string[];
}

export const decWorkflowTemplate: WorkflowPhase[] = [
    {
        name: 'Phase 1: Pre-Design & Initial Approvals (المرحلة الأولى: التجهيز والاعتمادات الأولية)',
        tasks: [
            '1. Open File with Serial No. (فتح الملف برقم تسلسلي)',
            '2. Receive Plot Site Plan (استلام مخطط الموقع)',
            '3. Client / End User Space Program Zoning (برنامج المساحات وتقسيمها)',
            '4. Client Awarding Letter (كتاب التكليف من العميل)',
            '5. Open File in Authorities (فتح ملف في الجهات المختصة)',
            '6. NOC\'s: Services Connection Points & Demarcation (شهادات عدم الممانعة: ربط الخدمات والعلامات الحدود)',
            '7.1 Geotechnical: Topographical Survey (التربة: المسح الطبوغرافي)',
            '7.2 Geotechnical: Soil Investigation Report (التربة: تقرير فحص التربة)',
            '7.3 Geotechnical: Soil Improvement Report (التربة: تقرير تحسين التربة)',
            '7.4 Geotechnical: Third Party Approval (التربة: اعتماد الطرف الثالث)'
        ]
    },
    {
        name: 'Phase 2: Design Phases (المرحلة الثانية: مراحل التصميم)',
        tasks: [
            '8.1 Concept Design: Data Collection & Pre-Design (التصميم المبدئي: جمع البيانات وما قبل التصميم)',
            '8.2 Concept Design: 2D Concept Design (التصميم المبدئي: التصميم ثنائي الأبعاد)',
            '8.3 Concept Design: 3D Massing & Exterior (التصميم المبدئي: الكتل والتصميم الخارجي)',
            '8.4 Concept Design: Presentation & Client Approval (التصميم المبدئي: العرض واعتماد العميل)',
            '9.1 Preliminary Design: Architectural Dev & 3D (التصميم الأولي: التطوير المعماري والقطاعات)',
            '9.2 Preliminary Design: MEP System & Strategy (التصميم الأولي: نظام واستراتيجية الميكانيكا والكهرباء)',
            '9.3 Preliminary Design: Structural System & Selection (التصميم الأولي: النظام الإنشائي)',
            '9.4 Preliminary Design: Outline Specifications (التصميم الأولي: المواصفات العامة)',
            '9.5 Preliminary Design: Initial Cost Estimate (التصميم الأولي: التقدير المبدئي للتكلفة)',
            '9.6 Preliminary Design: Coordination & Client Approval (التصميم الأولي: التنسيق واعتماد العميل)',
            '10.1 Detailed Design (100%): Final Dimensions & Details (التصميم التفصيلي: الأبعاد والتفاصيل النهائية)',
            '10.2 Detailed Design (100%): MEP Layouts & Calculations (التصميم التفصيلي: مخططات وحسابات الميكانيكا والكهرباء)',
            '10.3 Detailed Design (100%): Structural Final Drawings (التصميم التفصيلي: المخططات الإنشائية النهائية)',
            '10.4 Detailed Design (100%): BOQ & Tech Specs (التصميم التفصيلي: جداول الكميات والمواصفات الفنية)',
            '10.5 Detailed Design (100%): Final Cost Estimate (التصميم التفصيلي: التقدير النهائي للتكلفة)',
            '10.6 Detailed Design (100%): Design Coordination & Value Eng. (التصميم التفصيلي: التنسيق وهندسة القيمة)',
            '10.7 Detailed Design (100%): Client Final Approval (التصميم التفصيلي: الاعتماد النهائي للعميل)',
            '11.1 IFC: Final Revisions & Authority Feedback (المخططات التنفيذية: المراجعات النهائية)',
            '11.2 IFC: Issued for Construction Set (المخططات التنفيذية: إصدار المخططات للبناء)',
            '11.3 IFC: Document Handover to Contractor (المخططات التنفيذية: تسليم المستندات للمقاول)'
        ]
    },
    {
        name: 'Phase 3: Tender & Construction (المرحلة الثالثة: العطاءات والبناء)',
        tasks: [
            '12.1 Tendering: Tender Docs Preparation (المناقصة: إعداد مستندات المناقصة)',
            '12.2 Tendering: Bidders Invitation & Clarifications (المناقصة: دعوة المقاولين والاستفسارات)',
            '12.3 Tendering: Tender Evaluation Report (المناقصة: تقرير تقييم العطاءات)',
            '13.1 Appointing Contractor: Final Negotiations (تعيين المقاول: المفاوضات النهائية)',
            '13.2 Appointing Contractor: Contract Award (LOA) (تعيين المقاول: إرساء العقد)',
            '13.3 Appointing Contractor: Contract Sign & Handover (تعيين المقاول: توقيع العقد وتسليم الموقع)',
            '14. Project Initiation & Kick-off Meeting (بدء المشروع والاجتماع الافتتاحي)',
            '15. Supervision & Quality Control (الإشراف وضبط الجودة)',
            '16. Change Orders & Claims Mgt (أوامر التغيير وإدارة المطالبات)',
            '17. Project Close-out & Handing Over (إغلاق المشروع والتسليم النهائي)'
        ]
    },
    {
        name: 'Phase 4: Permitting & Municipality System (المرحلة الرابعة: التراخيص ونظام البلدية)',
        tasks: [
            '18.1 Master Developer Authorities (اعتمادات المطور الرئيسي)',
            '18.2 Municipality System NOC\'s (شهادات عدم الممانعة من البلدية)',
            '18.3 Civil Defense Approval (DCD) (اعتماد الدفاع المدني)',
            '18.4 Telecom Approval (Etisalat/Du) (اعتمادات الاتصالات)',
            '18.5 Electricity & Water (DEWA) (اعتمادات الكهرباء والماء)',
            '18.6 Roads & Transport (RTA) (اعتمادات الطرق والمواصلات)',
            '19. Final Building Permit Issuance (إصدار رخصة البناء النهائية)'
        ]
    }
];
