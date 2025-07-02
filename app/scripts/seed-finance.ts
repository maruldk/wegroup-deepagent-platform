
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedFinanceData() {
  console.log('🌱 Seeding financial data...');

  try {
    // Find demo tenant
    const tenant = await prisma.tenant.findFirst({
      where: {
        slug: 'demo-tenant'
      }
    });

    if (!tenant) {
      console.log('❌ Demo tenant not found. Please run main seed first.');
      return;
    }

    // Find demo user
    const user = await prisma.user.findFirst({
      where: {
        email: 'john@doe.com'
      }
    });

    if (!user) {
      console.log('❌ Demo user not found. Please run main seed first.');
      return;
    }

    console.log('✅ Found demo tenant and user');

    // Seed Expense Categories
    const expenseCategories = [
      {
        name: 'Marketing',
        description: 'Marketing und Werbung',
        color: '#60B5FF',
        icon: 'TrendingUp',
        tenantId: tenant.id
      },
      {
        name: 'Personal',
        description: 'Personalkosten und Gehälter',
        color: '#FF9149',
        icon: 'Users',
        tenantId: tenant.id
      },
      {
        name: 'Infrastruktur',
        description: 'IT und Infrastruktur',
        color: '#FF9898',
        icon: 'Server',
        tenantId: tenant.id
      },
      {
        name: 'Büro & Ausstattung',
        description: 'Büroausstattung und Materialien',
        color: '#FF90BB',
        icon: 'Building',
        tenantId: tenant.id
      },
      {
        name: 'Reisekosten',
        description: 'Geschäftsreisen und Transport',
        color: '#80D8C3',
        icon: 'Plane',
        tenantId: tenant.id
      },
      {
        name: 'Software & Lizenzen',
        description: 'Software-Lizenzen und Abonnements',
        color: '#A19AD3',
        icon: 'Monitor',
        tenantId: tenant.id
      },
      {
        name: 'Beratung',
        description: 'Externe Beratung und Services',
        color: '#72BF78',
        icon: 'Users',
        tenantId: tenant.id
      }
    ];

    console.log('🏷️ Creating expense categories...');
    const createdCategories = await Promise.all(
      expenseCategories.map(category =>
        prisma.expenseCategory.upsert({
          where: {
            name_tenantId: {
              name: category.name,
              tenantId: category.tenantId
            }
          },
          update: category,
          create: category
        })
      )
    );

    console.log(`✅ Created ${createdCategories.length} expense categories`);

    // Seed Budget Categories
    const budgetCategories = [
      {
        name: 'Operations',
        description: 'Operative Ausgaben',
        color: '#60B5FF',
        tenantId: tenant.id
      },
      {
        name: 'Growth',
        description: 'Wachstumsinvestitionen',
        color: '#FF9149',
        tenantId: tenant.id
      },
      {
        name: 'Infrastructure',
        description: 'Infrastruktur und Technologie',
        color: '#FF9898',
        tenantId: tenant.id
      },
      {
        name: 'Human Resources',
        description: 'Personalentwicklung',
        color: '#FF90BB',
        tenantId: tenant.id
      }
    ];

    console.log('📊 Creating budget categories...');
    const createdBudgetCategories = await Promise.all(
      budgetCategories.map(category =>
        prisma.budgetCategory.upsert({
          where: {
            name_tenantId: {
              name: category.name,
              tenantId: category.tenantId
            }
          },
          update: category,
          create: category
        })
      )
    );

    console.log(`✅ Created ${createdBudgetCategories.length} budget categories`);

    // Seed Budgets
    const budgets = [
      {
        name: 'Q1 2024 Marketing Budget',
        description: 'Marketing-Budget für das erste Quartal 2024',
        category: 'Marketing',
        budgetAmount: 25000,
        spentAmount: 18500,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-03-31'),
        tenantId: tenant.id,
        userId: user.id
      },
      {
        name: 'Personal Budget 2024',
        description: 'Jährliches Personal-Budget',
        category: 'Personal',
        budgetAmount: 180000,
        spentAmount: 85000,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        tenantId: tenant.id,
        userId: user.id
      },
      {
        name: 'IT Infrastruktur Q1',
        description: 'IT-Budget für das erste Quartal',
        category: 'Infrastruktur',
        budgetAmount: 15000,
        spentAmount: 12800,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-03-31'),
        tenantId: tenant.id,
        userId: user.id
      },
      {
        name: 'Büroausstattung 2024',
        description: 'Budget für Büroausstattung und Materialien',
        category: 'Büro & Ausstattung',
        budgetAmount: 8000,
        spentAmount: 3200,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        tenantId: tenant.id,
        userId: user.id
      }
    ];

    console.log('💰 Creating budgets...');
    const createdBudgets = await Promise.all(
      budgets.map(budget =>
        prisma.budget.create({
          data: budget
        })
      )
    );

    console.log(`✅ Created ${createdBudgets.length} budgets`);

    // Seed Expenses
    const expenses = [
      {
        title: 'Google Ads Kampagne',
        description: 'Q1 Marketing Kampagne für neue Kunden',
        amount: 2500,
        date: new Date('2024-03-15'),
        categoryId: createdCategories.find(c => c.name === 'Marketing')?.id,
        currency: 'EUR',
        status: 'APPROVED' as const,
        merchantName: 'Google Inc.',
        budgetId: createdBudgets.find(b => b.name === 'Q1 2024 Marketing Budget')?.id,
        tenantId: tenant.id,
        userId: user.id,
        approvedById: user.id,
        approvedAt: new Date('2024-03-16')
      },
      {
        title: 'Office Supplies',
        description: 'Büromaterialien für das Team',
        amount: 450,
        date: new Date('2024-03-14'),
        categoryId: createdCategories.find(c => c.name === 'Büro & Ausstattung')?.id,
        currency: 'EUR',
        status: 'APPROVED' as const,
        merchantName: 'Staples',
        budgetId: createdBudgets.find(b => b.name === 'Büroausstattung 2024')?.id,
        tenantId: tenant.id,
        userId: user.id,
        approvedById: user.id,
        approvedAt: new Date('2024-03-15')
      },
      {
        title: 'Software-Lizenz Slack',
        description: 'Jahresabonnement für Team-Kommunikation',
        amount: 1200,
        date: new Date('2024-03-10'),
        categoryId: createdCategories.find(c => c.name === 'Software & Lizenzen')?.id,
        currency: 'EUR',
        status: 'APPROVED' as const,
        merchantName: 'Slack Technologies',
        tenantId: tenant.id,
        userId: user.id,
        approvedById: user.id,
        approvedAt: new Date('2024-03-11')
      },
      {
        title: 'Server-Hosting AWS',
        description: 'Monatliche Cloud-Infrastruktur Kosten',
        amount: 890,
        date: new Date('2024-03-01'),
        categoryId: createdCategories.find(c => c.name === 'Infrastruktur')?.id,
        currency: 'EUR',
        status: 'PAID' as const,
        merchantName: 'Amazon Web Services',
        budgetId: createdBudgets.find(b => b.name === 'IT Infrastruktur Q1')?.id,
        tenantId: tenant.id,
        userId: user.id,
        approvedById: user.id,
        approvedAt: new Date('2024-03-02')
      },
      {
        title: 'Beratung UX Design',
        description: 'UX-Beratung für neue Produktfeatures',
        amount: 3500,
        date: new Date('2024-02-28'),
        categoryId: createdCategories.find(c => c.name === 'Beratung')?.id,
        currency: 'EUR',
        status: 'PENDING' as const,
        merchantName: 'Design Studio XYZ',
        tenantId: tenant.id,
        userId: user.id
      },
      {
        title: 'Geschäftsreise München',
        description: 'Reisekosten für Kundentermin',
        amount: 680,
        date: new Date('2024-02-25'),
        categoryId: createdCategories.find(c => c.name === 'Reisekosten')?.id,
        currency: 'EUR',
        status: 'APPROVED' as const,
        merchantName: 'Deutsche Bahn',
        tenantId: tenant.id,
        userId: user.id,
        approvedById: user.id,
        approvedAt: new Date('2024-02-26')
      }
    ];

    console.log('💸 Creating expenses...');
    const createdExpenses = await Promise.all(
      expenses.map(expense =>
        prisma.expense.create({
          data: expense
        })
      )
    );

    console.log(`✅ Created ${createdExpenses.length} expenses`);

    // Create expense approval history for approved expenses
    console.log('📋 Creating expense approval history...');
    const approvalHistory = [];
    for (const expense of createdExpenses.filter(e => e.status !== 'PENDING')) {
      approvalHistory.push({
        expenseId: expense.id,
        status: expense.status,
        comment: 'Automatisch genehmigt bei Seed-Erstellung',
        userId: user.id,
        tenantId: tenant.id,
        createdAt: expense.approvedAt || new Date()
      });
    }

    await Promise.all(
      approvalHistory.map(approval =>
        prisma.expenseApproval.create({
          data: approval
        })
      )
    );

    console.log(`✅ Created ${approvalHistory.length} approval history entries`);

    // Seed Financial KPIs
    const currentDate = new Date();
    const financialKPIs = [
      {
        name: 'REVENUE',
        value: 45000,
        target: 50000,
        unit: 'EUR',
        period: 'MONTHLY' as const,
        date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
        tenantId: tenant.id,
        metadata: {
          source: 'transactions',
          breakdown: {
            newCustomers: 25000,
            existingCustomers: 20000
          }
        }
      },
      {
        name: 'EXPENSES',
        value: 28000,
        target: 35000,
        unit: 'EUR',
        period: 'MONTHLY' as const,
        date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
        tenantId: tenant.id,
        metadata: {
          source: 'expenses',
          breakdown: {
            operational: 18000,
            marketing: 6000,
            infrastructure: 4000
          }
        }
      },
      {
        name: 'NET_CASH_FLOW',
        value: 17000,
        target: 15000,
        unit: 'EUR',
        period: 'MONTHLY' as const,
        date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
        tenantId: tenant.id,
        metadata: {
          revenue: 45000,
          expenses: 28000
        }
      },
      {
        name: 'PROFIT_MARGIN',
        value: 37.8,
        target: 30,
        unit: 'PERCENT',
        period: 'MONTHLY' as const,
        date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
        tenantId: tenant.id,
        metadata: {
          calculation: '(revenue - expenses) / revenue * 100'
        }
      }
    ];

    console.log('📊 Creating financial KPIs...');
    await Promise.all(
      financialKPIs.map(kpi =>
        prisma.financialKPI.upsert({
          where: {
            name_period_date_tenantId: {
              name: kpi.name,
              period: kpi.period,
              date: kpi.date,
              tenantId: kpi.tenantId
            }
          },
          update: kpi,
          create: kpi
        })
      )
    );

    console.log(`✅ Created ${financialKPIs.length} financial KPIs`);

    // Seed Cash Flow Predictions
    const cashFlowPredictions = [];
    for (let i = 1; i <= 6; i++) {
      const predictionDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
      cashFlowPredictions.push({
        predictionDate,
        predictedInflow: 45000 + (Math.random() * 10000 - 5000), // ±5k variance
        predictedOutflow: 30000 + (Math.random() * 8000 - 4000), // ±4k variance
        netCashFlow: 15000 + (Math.random() * 6000 - 3000), // ±3k variance
        confidence: Math.max(0.3, 0.9 - (i * 0.1)), // Decreasing confidence
        modelVersion: 'v1.0-seed',
        tenantId: tenant.id
      });
    }

    console.log('🔮 Creating cash flow predictions...');
    await Promise.all(
      cashFlowPredictions.map(prediction =>
        prisma.cashFlowPrediction.create({
          data: prediction
        })
      )
    );

    console.log(`✅ Created ${cashFlowPredictions.length} cash flow predictions`);

    // Update budget spent amounts based on approved expenses
    console.log('🔄 Updating budget spent amounts...');
    for (const budget of createdBudgets) {
      const totalSpent = await prisma.expense.aggregate({
        where: {
          budgetId: budget.id,
          status: { in: ['APPROVED', 'PAID'] }
        },
        _sum: { amount: true }
      });

      await prisma.budget.update({
        where: { id: budget.id },
        data: {
          spentAmount: totalSpent._sum.amount || 0
        }
      });
    }

    console.log('✅ Updated budget spent amounts');

    console.log('🎉 Financial data seeding completed successfully!');

    // Summary
    console.log('\n📋 Seeding Summary:');
    console.log(`   • ${createdCategories.length} Expense Categories`);
    console.log(`   • ${createdBudgetCategories.length} Budget Categories`);
    console.log(`   • ${createdBudgets.length} Budgets`);
    console.log(`   • ${createdExpenses.length} Expenses`);
    console.log(`   • ${approvalHistory.length} Approval History Entries`);
    console.log(`   • ${financialKPIs.length} Financial KPIs`);
    console.log(`   • ${cashFlowPredictions.length} Cash Flow Predictions`);

  } catch (error) {
    console.error('❌ Error seeding financial data:', error);
    throw error;
  }
}

async function main() {
  try {
    await seedFinanceData();
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

export { seedFinanceData };
