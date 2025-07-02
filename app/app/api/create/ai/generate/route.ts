
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
      type, // document, design, copy, presentation, social_media
      prompt,
      category,
      specifications = {},
      tone = 'professional',
      language = 'de',
      length = 'medium'
    } = data;

    if (!type || !prompt) {
      return NextResponse.json(
        { error: 'Type und Prompt sind erforderlich' },
        { status: 400 }
      );
    }

    // Build AI prompt based on type
    let systemPrompt = '';
    let userPrompt = prompt;

    switch (type) {
      case 'document':
        systemPrompt = `Du bist ein professioneller Content-Writer. Erstelle hochwertigen, strukturierten Dokumentinhalt in deutscher Sprache. 
        Ton: ${tone}. Länge: ${length}. 
        Format: Strukturiertes Dokument mit Überschriften, Absätzen und ggf. Listen.
        Beachte die folgenden Spezifikationen: ${JSON.stringify(specifications)}`;
        break;

      case 'copy':
        systemPrompt = `Du bist ein Marketing-Copywriter. Erstelle überzeugende, verkaufsorientierte Texte in deutscher Sprache.
        Ton: ${tone}. Länge: ${length}.
        Format: Verkaufstext mit starken Headlines und Call-to-Actions.
        Beachte die folgenden Spezifikationen: ${JSON.stringify(specifications)}`;
        break;

      case 'presentation':
        systemPrompt = `Du bist ein Präsentationsexperte. Erstelle strukturierte Präsentationsinhalte in deutscher Sprache.
        Ton: ${tone}. Länge: ${length}.
        Format: Folienstruktur mit Titeln, Bullet Points und Kerninhalten.
        Beachte die folgenden Spezifikationen: ${JSON.stringify(specifications)}`;
        break;

      case 'social_media':
        systemPrompt = `Du bist ein Social Media Manager. Erstelle engaging Social Media Content in deutscher Sprache.
        Ton: ${tone}. Länge: ${length}.
        Format: Social Media Posts mit Hashtags und Call-to-Actions.
        Beachte die folgenden Spezifikationen: ${JSON.stringify(specifications)}`;
        break;

      case 'design':
        systemPrompt = `Du bist ein Design-Experte. Erstelle detaillierte Design-Briefings und -Konzepte in deutscher Sprache.
        Ton: ${tone}. 
        Format: Design-Brief mit Farben, Typografie, Layout-Beschreibung.
        Beachte die folgenden Spezifikationen: ${JSON.stringify(specifications)}`;
        break;

      default:
        systemPrompt = `Du bist ein professioneller Content-Creator. Erstelle hochwertigen Content in deutscher Sprache.
        Ton: ${tone}. Länge: ${length}.
        Beachte die folgenden Spezifikationen: ${JSON.stringify(specifications)}`;
    }

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
        temperature: 0.7,
        max_tokens: length === 'short' ? 500 : length === 'long' ? 2000 : 1000,
      }),
    });

    if (!llmResponse.ok) {
      throw new Error(`LLM API error: ${llmResponse.status}`);
    }

    const llmResult = await llmResponse.json();
    const generatedContent = llmResult.choices?.[0]?.message?.content;

    if (!generatedContent) {
      throw new Error('No content generated');
    }

    // Structure the response based on type
    let structuredContent = {};

    switch (type) {
      case 'document':
        // Parse document structure
        const sections = generatedContent.split('\n\n').filter(s => s.trim());
        structuredContent = {
          title: sections[0]?.replace(/^#\s*/, '') || 'Untitled Document',
          content: generatedContent,
          sections: sections.map((section, index) => ({
            id: `section-${index}`,
            content: section,
            type: section.startsWith('#') ? 'heading' : 'paragraph'
          })),
          wordCount: generatedContent.split(/\s+/).length,
        };
        break;

      case 'presentation':
        // Parse slides structure
        const slides = generatedContent.split(/\n(?=Folie|\d+\.|\*\*)/g).filter(s => s.trim());
        structuredContent = {
          title: slides[0]?.split('\n')[0] || 'Untitled Presentation',
          content: generatedContent,
          slides: slides.map((slide, index) => ({
            id: `slide-${index + 1}`,
            title: slide.split('\n')[0]?.replace(/^(Folie\s*\d+:|^\d+\.|^\*\*|\*)/, '').trim(),
            content: slide,
            slideNumber: index + 1,
          })),
          slideCount: slides.length,
        };
        break;

      case 'design':
        structuredContent = {
          brief: generatedContent,
          content: generatedContent,
          designType: specifications.designType || 'general',
          colorScheme: specifications.colors || [],
          typography: specifications.fonts || [],
        };
        break;

      default:
        structuredContent = {
          content: generatedContent,
          wordCount: generatedContent.split(/\s+/).length,
        };
    }

    // Add metadata
    const response = {
      type,
      prompt,
      generatedContent,
      structuredContent,
      metadata: {
        aiGenerated: true,
        aiPrompt: prompt,
        aiModel: 'gpt-4.1-mini',
        generatedAt: new Date().toISOString(),
        specifications,
        tone,
        language,
        length,
        category,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('AI generation error:', error);
    return NextResponse.json(
      { error: 'Fehler bei der AI-Generierung' },
      { status: 500 }
    );
  }
}
