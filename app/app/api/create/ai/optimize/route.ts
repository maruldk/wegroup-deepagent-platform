
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const {
      content,
      optimizationType, // seo, readability, engagement, conversion, grammar
      targetAudience = 'general',
      keywords = [],
      tone = 'professional',
      language = 'de'
    } = data;

    if (!content || !optimizationType) {
      return NextResponse.json(
        { error: 'Content und OptimizationType sind erforderlich' },
        { status: 400 }
      );
    }

    // Build optimization prompt based on type
    let systemPrompt = '';
    let optimizationGoal = '';

    switch (optimizationType) {
      case 'seo':
        optimizationGoal = `SEO-Optimierung für bessere Suchmaschinen-Rankings`;
        systemPrompt = `Du bist ein SEO-Experte. Optimiere den folgenden Content für Suchmaschinen.
        Zielgruppe: ${targetAudience}
        Keywords: ${keywords.join(', ')}
        
        Fokussiere auf:
        - Natürliche Integration der Keywords
        - Verbesserte Meta-Beschreibungen
        - Strukturierte Überschriften (H1, H2, H3)
        - Bessere Lesbarkeit
        - Call-to-Actions
        
        Gib sowohl den optimierten Content als auch konkrete Verbesserungsvorschläge aus.`;
        break;

      case 'readability':
        optimizationGoal = `Verbesserung der Lesbarkeit und Verständlichkeit`;
        systemPrompt = `Du bist ein Content-Editor. Verbessere die Lesbarkeit des folgenden Textes.
        Zielgruppe: ${targetAudience}
        Ton: ${tone}
        
        Fokussiere auf:
        - Kürzere, klarere Sätze
        - Bessere Absatzstruktur
        - Einfachere Sprache
        - Logische Gliederung
        - Entfernung von Füllwörtern
        
        Behalte die Kernbotschaft bei, aber mache den Text zugänglicher.`;
        break;

      case 'engagement':
        optimizationGoal = `Steigerung des User-Engagements`;
        systemPrompt = `Du bist ein Content-Marketing-Experte. Optimiere den Content für maximales Engagement.
        Zielgruppe: ${targetAudience}
        Ton: ${tone}
        
        Fokussiere auf:
        - Fesselnde Headlines
        - Emotionale Trigger
        - Storytelling-Elemente
        - Interaktive Komponenten
        - Starke Call-to-Actions
        - Social Media Optimierung
        
        Mache den Content viral-würdig und teilbar.`;
        break;

      case 'conversion':
        optimizationGoal = `Conversion-Optimierung für bessere Verkaufsresultate`;
        systemPrompt = `Du bist ein Conversion-Optimierungs-Experte. Optimiere den Content für höhere Conversion-Raten.
        Zielgruppe: ${targetAudience}
        
        Fokussiere auf:
        - Klare Wertversprechen
        - Vertrauenssignale
        - Dringlichkeit und Knappheit
        - Starke CTAs
        - Benefit-orientierte Sprache
        - Einwandbehandlung
        
        Maximiere die Verkaufswirkung des Contents.`;
        break;

      case 'grammar':
        optimizationGoal = `Korrektur von Grammatik und Rechtschreibung`;
        systemPrompt = `Du bist ein professioneller Lektor. Korrigiere Grammatik, Rechtschreibung und Stil.
        Sprache: ${language}
        Ton: ${tone}
        
        Fokussiere auf:
        - Grammatikfehler
        - Rechtschreibung
        - Zeichensetzung
        - Stilistische Verbesserungen
        - Einheitliche Terminologie
        
        Behalte die ursprüngliche Bedeutung und den Stil bei.`;
        break;

      default:
        optimizationGoal = `Allgemeine Content-Optimierung`;
        systemPrompt = `Du bist ein Content-Experte. Verbessere den folgenden Content ganzheitlich.
        Zielgruppe: ${targetAudience}
        Ton: ${tone}
        
        Fokussiere auf alle wichtigen Aspekte: Lesbarkeit, Engagement, SEO und Conversion.`;
    }

    const userPrompt = `Hier ist der zu optimierende Content:

${content}

Optimierungsziel: ${optimizationGoal}

Bitte gib aus:
1. Den optimierten Content
2. Eine Liste der wichtigsten Verbesserungen
3. Konkrete Handlungsempfehlungen
4. Eine Bewertung der Optimierung (1-10)`;

    // Call LLM API
    const llmResponse = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3, // Lower temperature for optimization tasks
        max_tokens: 2000,
      }),
    });

    if (!llmResponse.ok) {
      throw new Error(`LLM API error: ${llmResponse.status}`);
    }

    const llmResult = await llmResponse.json();
    const optimizationResult = llmResult.choices?.[0]?.message?.content;

    if (!optimizationResult) {
      throw new Error('No optimization result generated');
    }

    // Parse the response to extract different sections
    const sections = optimizationResult.split(/\n(?=\d+\.)/);
    
    const response = {
      originalContent: content,
      optimizedContent: optimizationResult,
      optimizationType,
      metadata: {
        optimizedAt: new Date().toISOString(),
        optimizationGoal,
        targetAudience,
        keywords,
        tone,
        language,
        aiModel: 'gpt-4.1-mini',
      },
      sections: sections.length > 1 ? sections : [optimizationResult],
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('AI optimization error:', error);
    return NextResponse.json(
      { error: 'Fehler bei der AI-Optimierung' },
      { status: 500 }
    );
  }
}
