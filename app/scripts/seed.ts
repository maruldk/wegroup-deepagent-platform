
import { 
  PrismaClient, 
  CustomerStatus, 
  LeadStatus,
  InvoiceStatus,
  TransactionType,
  ProjectStatus,
  TaskStatus,
  TaskPriority,
  WidgetType,
  ReportType
} from '@prisma/client';
import bcrypt from 'bcryptjs';
import seedEventOrchestration from './seed-events';
import { seedMultiTenant } from './seed-multi-tenant';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // ==================== MULTI-TENANT SYSTEM SETUP ====================
  console.log('🏢 Setting up Multi-Tenant System...');
  await seedMultiTenant();
  
  // Get the weGROUP tenant (created by multi-tenant seeding)
  const defaultTenant = await prisma.tenant.findUnique({
    where: { slug: 'wegroup' }
  });
  
  if (!defaultTenant) {
    throw new Error('weGROUP tenant not found after multi-tenant seeding');
  }

  console.log('✅ Multi-Tenant System initialized');

  // Get demo users (already created by multi-tenant seeding)
  const adminUser = await prisma.user.findUnique({
    where: { email: 'john@doe.com' }
  });
  
  const managerUser = await prisma.user.findUnique({
    where: { email: 'ceo@wegroup.de' }
  });
  
  const regularUser = await prisma.user.findUnique({
    where: { email: 'david.klein@wesell.de' }
  });

  if (!adminUser || !managerUser || !regularUser) {
    throw new Error('Required demo users not found after multi-tenant seeding');
  }

  console.log('✅ Using multi-tenant demo users');

  // Create demo customers
  const customers = [
    {
      companyName: 'Tech Solutions GmbH',
      contactPerson: 'Hans Müller',
      email: 'h.mueller@techsolutions.de',
      phone: '+49 89 123456',
      address: 'Maximilianstraße 1',
      city: 'München',
      postalCode: '80331',
      country: 'Deutschland',
      status: CustomerStatus.ACTIVE,
      notes: 'Langjähriger Kunde mit hohem Potenzial',
    },
    {
      companyName: 'Digital Innovations AG',
      contactPerson: 'Sarah Weber',
      email: 's.weber@digital-innovations.com',
      phone: '+49 30 987654',
      address: 'Unter den Linden 77',
      city: 'Berlin',
      postalCode: '10117',
      country: 'Deutschland',
      status: CustomerStatus.PROSPECT,
      notes: 'Interessiert an KI-Lösungen',
    },
    {
      companyName: 'AutoParts International',
      contactPerson: 'Michael Schmidt',
      email: 'm.schmidt@autoparts.com',
      phone: '+49 711 555777',
      address: 'Industriestraße 45',
      city: 'Stuttgart',
      postalCode: '70565',
      country: 'Deutschland',
      status: CustomerStatus.ACTIVE,
      notes: 'Großkunde für Logistiklösungen',
    },
  ];

  for (const customerData of customers) {
    // Check if customer already exists
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        companyName: customerData.companyName,
        tenantId: defaultTenant.id,
      },
    });

    if (!existingCustomer) {
      await prisma.customer.create({
        data: {
          ...customerData,
          tenantId: defaultTenant.id,
        },
      });
    }
  }

  console.log('✅ Created demo customers');

  // Create demo leads
  const leads = [
    {
      companyName: 'StartUp Ventures',
      contactPerson: 'Lisa Frank',
      email: 'l.frank@startup-ventures.com',
      phone: '+49 40 111222',
      status: LeadStatus.QUALIFIED,
      source: 'Website',
      notes: 'Interessiert an CRM-Lösung',
      estimatedValue: 15000,
      assignedUserId: managerUser.id,
    },
    {
      companyName: 'Global Retail Chain',
      contactPerson: 'Robert Johnson',
      email: 'r.johnson@globalretail.com',
      phone: '+49 221 333444',
      status: LeadStatus.PROPOSAL,
      source: 'Referral',
      notes: 'Großprojekt - Multi-Tenant Setup',
      estimatedValue: 50000,
      assignedUserId: adminUser.id,
    },
    {
      companyName: 'Local Services Ltd',
      contactPerson: 'Anna Klein',
      email: 'a.klein@localservices.de',
      phone: '+49 69 666777',
      status: LeadStatus.NEW,
      source: 'Cold Call',
      notes: 'Erstkontakt hergestellt',
      estimatedValue: 8000,
      assignedUserId: regularUser.id,
    },
  ];

  for (const leadData of leads) {
    // Check if lead already exists
    const existingLead = await prisma.lead.findFirst({
      where: {
        companyName: leadData.companyName,
        tenantId: defaultTenant.id,
      },
    });

    if (!existingLead) {
      await prisma.lead.create({
        data: {
          ...leadData,
          tenantId: defaultTenant.id,
        },
      });
    }
  }

  console.log('✅ Created demo leads');

  // Create some contact history
  const customer = await prisma.customer.findFirst({
    where: { companyName: 'Tech Solutions GmbH' },
  });

  if (customer) {
    await prisma.contactHistory.create({
      data: {
        customerId: customer.id,
        userId: adminUser.id,
        type: 'CALL',
        description: 'Erstes Beratungsgespräch über KI-Integration',
      },
    });

    await prisma.contactHistory.create({
      data: {
        customerId: customer.id,
        userId: managerUser.id,
        type: 'EMAIL',
        description: 'Angebot für DeepAgent Plattform gesendet',
      },
    });
  }

  console.log('✅ Created demo contact history');

  // ==================== ANALYTICS Demo Data ====================
  
  // Create tax categories for finance module
  const taxCategories = [
    { name: 'Standard', rate: 19.0 },
    { name: 'Ermäßigt', rate: 7.0 },
    { name: 'Befreit', rate: 0.0 }
  ];

  for (const taxData of taxCategories) {
    await prisma.taxCategory.upsert({
      where: { 
        name_tenantId: { 
          name: taxData.name, 
          tenantId: defaultTenant.id 
        } 
      },
      update: {},
      create: {
        ...taxData,
        tenantId: defaultTenant.id,
      },
    });
  }

  console.log('✅ Created tax categories');

  // Create default dashboard
  const defaultDashboard = await prisma.dashboard.upsert({
    where: { id: 'default-dashboard' },
    update: {},
    create: {
      id: 'default-dashboard',
      name: 'Hauptdashboard',
      description: 'Standard Dashboard mit wichtigsten KPIs',
      isDefault: true,
      layout: {
        columns: 3,
        rows: 4,
      },
      tenantId: defaultTenant.id,
      userId: adminUser.id,
    },
  });

  // Create dashboard widgets
  const widgets = [
    {
      name: 'Kunden Overview',
      type: WidgetType.METRIC_CARD,
      config: { metric: 'total_customers', color: '#3B82F6' },
      position: { x: 0, y: 0 },
      size: { width: 1, height: 1 },
      dataSource: 'customers',
    },
    {
      name: 'Lead Pipeline',
      type: WidgetType.CHART_BAR,
      config: { 
        chartType: 'bar',
        xAxis: 'status',
        yAxis: 'count',
        color: '#10B981'
      },
      position: { x: 1, y: 0 },
      size: { width: 2, height: 1 },
      dataSource: 'leads',
    },
    {
      name: 'Umsatz Entwicklung',
      type: WidgetType.CHART_LINE,
      config: { 
        chartType: 'line',
        xAxis: 'month',
        yAxis: 'revenue',
        color: '#8B5CF6'
      },
      position: { x: 0, y: 1 },
      size: { width: 3, height: 1 },
      dataSource: 'invoices',
    },
  ];

  for (const widgetData of widgets) {
    await prisma.widget.create({
      data: {
        ...widgetData,
        dashboardId: defaultDashboard.id,
        tenantId: defaultTenant.id,
      },
    });
  }

  // Create metrics
  const metrics = [
    {
      name: 'Conversion Rate',
      description: 'Lead zu Kunde Conversion Rate',
      formula: '(leads_won / total_leads) * 100',
      target: 25.0,
      currentValue: 22.5,
    },
    {
      name: 'Customer Lifetime Value',
      description: 'Durchschnittlicher Kundenwert',
      formula: 'avg(customer_revenue)',
      target: 15000.0,
      currentValue: 14250.0,
    },
    {
      name: 'Monthly Recurring Revenue',
      description: 'Monatlich wiederkehrende Umsätze',
      formula: 'sum(monthly_subscriptions)',
      target: 50000.0,
      currentValue: 47500.0,
    },
  ];

  for (const metricData of metrics) {
    await prisma.metric.create({
      data: {
        ...metricData,
        tenantId: defaultTenant.id,
      },
    });
  }

  // Create sample reports
  const reports = [
    {
      name: 'Monatlicher Geschäftsbericht',
      description: 'Zusammenfassung aller wichtigen KPIs',
      type: ReportType.ANALYTICS,
      config: {
        period: 'monthly',
        sections: ['customers', 'leads', 'revenue'],
      },
      data: {
        generated_at: new Date().toISOString(),
        period: 'December 2024',
        summary: 'Starkes Wachstum bei Leads und Kunden',
      },
      userId: adminUser.id,
    },
    {
      name: 'Projektfortschritt Report',
      description: 'Übersicht über alle laufenden Projekte',
      type: ReportType.PROJECT,
      config: {
        projects: 'active',
        metrics: ['completion', 'budget', 'timeline'],
      },
      data: {
        generated_at: new Date().toISOString(),
        active_projects: 5,
        completion_rate: 78,
      },
      userId: managerUser.id,
    },
  ];

  for (const reportData of reports) {
    await prisma.report.create({
      data: {
        ...reportData,
        tenantId: defaultTenant.id,
      },
    });
  }

  console.log('✅ Created ANALYTICS demo data');

  // ==================== FINANCE Demo Data ====================

  // Create demo invoices
  const invoices = [
    {
      invoiceNumber: 'INV-2024-001',
      customerId: customer?.id,
      customerName: customer?.companyName || 'Tech Solutions GmbH',
      customerEmail: customer?.email || 'h.mueller@techsolutions.de',
      customerAddress: `${customer?.address || 'Maximilianstraße 1'}\n${customer?.postalCode || '80331'} ${customer?.city || 'München'}`,
      status: InvoiceStatus.PAID,
      issueDate: new Date('2024-12-01'),
      dueDate: new Date('2024-12-31'),
      subtotal: 10000.0,
      taxAmount: 1900.0,
      totalAmount: 11900.0,
      notes: 'DeepAgent Plattform Setup und Integration',
      terms: 'Zahlung innerhalb 30 Tagen',
      userId: adminUser.id,
    },
    {
      invoiceNumber: 'INV-2024-002',
      customerName: 'Digital Innovations AG',
      customerEmail: 's.weber@digital-innovations.com',
      customerAddress: 'Unter den Linden 77\n10117 Berlin',
      status: InvoiceStatus.SENT,
      issueDate: new Date('2024-12-15'),
      dueDate: new Date('2025-01-15'),
      subtotal: 7500.0,
      taxAmount: 1425.0,
      totalAmount: 8925.0,
      notes: 'KI-Beratung und Analysedashboard',
      terms: 'Zahlung innerhalb 30 Tagen',
      userId: managerUser.id,
    },
  ];

  for (const invoiceData of invoices) {
    // Check if invoice already exists
    let invoice = await prisma.invoice.findUnique({
      where: { invoiceNumber: invoiceData.invoiceNumber }
    });
    
    if (!invoice) {
      invoice = await prisma.invoice.create({
        data: {
          ...invoiceData,
          tenantId: defaultTenant.id,
        },
      });
    }

    // Create invoice items
    const items = invoiceData.invoiceNumber === 'INV-2024-001' 
      ? [
          {
            description: 'DeepAgent Plattform Lizenz (12 Monate)',
            quantity: 1,
            unitPrice: 8000.0,
            taxRate: 19.0,
            totalPrice: 8000.0,
          },
          {
            description: 'Setup und Integration',
            quantity: 20,
            unitPrice: 100.0,
            taxRate: 19.0,
            totalPrice: 2000.0,
          },
        ]
      : [
          {
            description: 'KI-Beratung (40 Stunden)',
            quantity: 40,
            unitPrice: 150.0,
            taxRate: 19.0,
            totalPrice: 6000.0,
          },
          {
            description: 'Dashboard Entwicklung',
            quantity: 1,
            unitPrice: 1500.0,
            taxRate: 19.0,
            totalPrice: 1500.0,
          },
        ];

    for (const itemData of items) {
      await prisma.invoiceItem.create({
        data: {
          ...itemData,
          invoiceId: invoice.id,
          tenantId: defaultTenant.id,
        },
      });
    }
  }

  // Create demo transactions
  const transactions = [
    {
      description: 'Zahlung Invoice INV-2024-001',
      amount: 11900.0,
      type: TransactionType.INCOME,
      category: 'Lizenzgebühren',
      date: new Date('2024-12-10'),
      reference: 'INV-2024-001',
      userId: adminUser.id,
    },
    {
      description: 'Büroausstattung',
      amount: -2500.0,
      type: TransactionType.EXPENSE,
      category: 'Büromaterial',
      date: new Date('2024-12-05'),
      reference: 'EXP-2024-045',
      userId: managerUser.id,
    },
    {
      description: 'Software Lizenzen',
      amount: -1200.0,
      type: TransactionType.EXPENSE,
      category: 'Software',
      date: new Date('2024-12-08'),
      reference: 'EXP-2024-046',
      userId: adminUser.id,
    },
  ];

  for (const transactionData of transactions) {
    await prisma.transaction.create({
      data: {
        ...transactionData,
        tenantId: defaultTenant.id,
      },
    });
  }

  // Create demo budgets
  const budgets = [
    {
      name: 'Marketing Budget Q4',
      description: 'Budget für Marketingaktivitäten im 4. Quartal',
      category: 'Marketing',
      budgetAmount: 15000.0,
      spentAmount: 8750.0,
      startDate: new Date('2024-10-01'),
      endDate: new Date('2024-12-31'),
      userId: managerUser.id,
    },
    {
      name: 'Entwicklung Budget',
      description: 'Jahresbudget für Softwareentwicklung',
      category: 'Entwicklung',
      budgetAmount: 50000.0,
      spentAmount: 32500.0,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      userId: adminUser.id,
    },
  ];

  for (const budgetData of budgets) {
    await prisma.budget.create({
      data: {
        ...budgetData,
        tenantId: defaultTenant.id,
      },
    });
  }

  console.log('✅ Created FINANCE demo data');

  // ==================== PROJECT Demo Data ====================

  // Create demo projects
  const projects = [
    {
      name: 'DeepAgent Platform V2.0',
      description: 'Entwicklung der nächsten Generation der DeepAgent Plattform mit erweiterten KI-Funktionen',
      status: ProjectStatus.ACTIVE,
      startDate: new Date('2024-11-01'),
      endDate: new Date('2025-03-31'),
      budget: 75000.0,
      managerId: adminUser.id,
    },
    {
      name: 'Customer Portal Integration',
      description: 'Integration eines Self-Service Kundenportals',
      status: ProjectStatus.ACTIVE,
      startDate: new Date('2024-12-01'),
      endDate: new Date('2025-02-28'),
      budget: 25000.0,
      managerId: managerUser.id,
    },
    {
      name: 'Mobile App Development',
      description: 'Entwicklung einer mobilen App für iOS und Android',
      status: ProjectStatus.PLANNING,
      startDate: new Date('2025-01-15'),
      endDate: new Date('2025-06-30'),
      budget: 45000.0,
      managerId: adminUser.id,
    },
  ];

  const createdProjects = [];
  for (const projectData of projects) {
    const project = await prisma.project.create({
      data: {
        ...projectData,
        tenantId: defaultTenant.id,
      },
    });
    createdProjects.push(project);
  }

  // Create project members
  for (const project of createdProjects) {
    const members = [
      { userId: adminUser.id, role: 'Project Manager' },
      { userId: managerUser.id, role: 'Technical Lead' },
      { userId: regularUser.id, role: 'Developer' },
    ];

    for (const memberData of members) {
      await prisma.projectMember.create({
        data: {
          ...memberData,
          projectId: project.id,
          tenantId: defaultTenant.id,
        },
      });
    }
  }

  // Create demo tasks
  const [project1, project2] = createdProjects;
  
  const tasks = [
    {
      projectId: project1.id,
      name: 'API Design und Architektur',
      description: 'Entwurf der REST API und Datenbankarchitektur',
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      assigneeId: adminUser.id,
      startDate: new Date('2024-11-01'),
      dueDate: new Date('2024-11-15'),
      estimatedHours: 40.0,
      actualHours: 38.0,
    },
    {
      projectId: project1.id,
      name: 'Frontend Komponenten entwickeln',
      description: 'React Komponenten für das neue Dashboard',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      assigneeId: regularUser.id,
      startDate: new Date('2024-11-15'),
      dueDate: new Date('2024-12-30'),
      estimatedHours: 80.0,
      actualHours: 45.0,
    },
    {
      projectId: project1.id,
      name: 'KI Model Integration',
      description: 'Integration neuer KI-Modelle in die Plattform',
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      assigneeId: managerUser.id,
      startDate: new Date('2025-01-01'),
      dueDate: new Date('2025-02-15'),
      estimatedHours: 60.0,
    },
    {
      projectId: project2.id,
      name: 'Benutzeranalyse und Konzept',
      description: 'Analyse der Benutzerbedürfnisse für das Kundenportal',
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      assigneeId: managerUser.id,
      startDate: new Date('2024-12-01'),
      dueDate: new Date('2024-12-15'),
      estimatedHours: 20.0,
      actualHours: 22.0,
    },
  ];

  for (const taskData of tasks) {
    await prisma.task.create({
      data: {
        ...taskData,
        tenantId: defaultTenant.id,
      },
    });
  }

  // Create milestones
  const milestones = [
    {
      projectId: project1.id,
      name: 'MVP Release',
      description: 'Erste funktionsfähige Version der Platform V2.0',
      dueDate: new Date('2025-01-31'),
      isCompleted: false,
    },
    {
      projectId: project1.id,
      name: 'Beta Testing',
      description: 'Beta Tests mit ausgewählten Kunden',
      dueDate: new Date('2025-02-28'),
      isCompleted: false,
    },
    {
      projectId: project2.id,
      name: 'Portal Design Freigabe',
      description: 'Finales Design für das Kundenportal',
      dueDate: new Date('2025-01-15'),
      isCompleted: false,
    },
  ];

  for (const milestoneData of milestones) {
    await prisma.milestone.create({
      data: {
        ...milestoneData,
        tenantId: defaultTenant.id,
      },
    });
  }

  // Create demo timesheets
  const timesheets = [
    {
      projectId: project1.id,
      userId: adminUser.id,
      date: new Date('2024-12-15'),
      hours: 8.0,
      description: 'API Entwicklung und Code Review',
    },
    {
      projectId: project1.id,
      userId: regularUser.id,
      date: new Date('2024-12-15'),
      hours: 6.5,
      description: 'Frontend Komponenten für Dashboard',
    },
    {
      projectId: project2.id,
      userId: managerUser.id,
      date: new Date('2024-12-15'),
      hours: 4.0,
      description: 'Kundengespräche und Anforderungsanalyse',
    },
  ];

  for (const timesheetData of timesheets) {
    await prisma.timesheet.create({
      data: {
        ...timesheetData,
        tenantId: defaultTenant.id,
      },
    });
  }

  console.log('✅ Created PROJECT demo data');

  // Seed Event Orchestration System
  console.log('🚀 Seeding Event Orchestration...');
  await seedEventOrchestration();

  console.log('🎉 Seed completed successfully with all modules!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
