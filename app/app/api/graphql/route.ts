
// SPRINT 2.9 - GraphQL API Routes
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { graphqlService } from '@/lib/services/graphql-service'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/graphql - Get GraphQL analytics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!user?.tenantId) {
      return NextResponse.json({ error: 'No tenant found' }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const timeRange = parseInt(searchParams.get('timeRange') || '7')

    const analytics = await graphqlService.getGraphQLAnalytics(user.tenantId, timeRange)

    return NextResponse.json({
      success: true,
      data: analytics
    })
  } catch (error) {
    console.error('GraphQL analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to get GraphQL analytics' },
      { status: 500 }
    )
  }
}

// POST /api/graphql - Execute GraphQL query or manage schema
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!user?.tenantId) {
      return NextResponse.json({ error: 'No tenant found' }, { status: 400 })
    }

    const body = await request.json()
    const { query, variables, operationName, action, schemaConfig, schemaId } = body

    if (query && !action) {
      // Execute GraphQL query
      const context = {
        user,
        tenantId: user.tenantId
      }

      const result = await graphqlService.executeQuery(
        query,
        variables,
        context,
        user.tenantId
      )

      return NextResponse.json({
        success: !result.errors,
        data: result.data,
        errors: result.errors
      })
    }

    switch (action) {
      case 'create_schema':
        if (!schemaConfig) {
          return NextResponse.json({ error: 'Schema config required' }, { status: 400 })
        }

        const newSchemaId = await graphqlService.createSchema(
          schemaConfig,
          user.tenantId
        )

        return NextResponse.json({
          success: true,
          data: { schemaId: newSchemaId },
          message: 'GraphQL schema created successfully'
        })

      case 'activate_schema':
        if (!schemaId) {
          return NextResponse.json({ error: 'Schema ID required' }, { status: 400 })
        }

        const activated = await graphqlService.activateSchema(schemaId, user.tenantId)

        return NextResponse.json({
          success: activated,
          message: activated ? 'Schema activated successfully' : 'Failed to activate schema'
        })

      case 'deprecate_schema':
        if (!schemaId) {
          return NextResponse.json({ error: 'Schema ID required' }, { status: 400 })
        }

        const deprecated = await graphqlService.deprecateSchema(
          schemaId,
          body.reason || 'No reason provided',
          body.deprecationDate
        )

        return NextResponse.json({
          success: deprecated,
          message: deprecated ? 'Schema deprecated successfully' : 'Failed to deprecate schema'
        })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('GraphQL operation error:', error)
    return NextResponse.json(
      { error: 'GraphQL operation failed' },
      { status: 500 }
    )
  }
}
