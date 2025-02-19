import { NextRequest, NextResponse } from "next/server";
import { FILTER_MAPPINGS } from "@/lib/filterMappings";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const level = searchParams.get("level");
  const subject = searchParams.get("subject");
  const module = searchParams.get("module");
  const topic = searchParams.get("topic");

  console.log("Cascading filters request:", { level, subject, module, topic });

  try {
    switch (level) {
      case "subjects":
        return NextResponse.json(FILTER_MAPPINGS.subjects);

      case "modules":
        if (subject) {
          return NextResponse.json(
            FILTER_MAPPINGS.modulesBySubject[subject] || [],
          );
        }
        return NextResponse.json([]);

      case "topics":
        if (module) {
          return NextResponse.json(
            FILTER_MAPPINGS.topicsByModule[module] || [],
          );
        }
        return NextResponse.json([]);

      case "question_types":
        return NextResponse.json(FILTER_MAPPINGS.questionTypes);

      default:
        return NextResponse.json(
          { error: "Invalid level specified" },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error("Cascading filters error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
