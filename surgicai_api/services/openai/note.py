import os

from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


DEFAULT_TEMPLATE = open(
    os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "default_template.txt",
    ),
    "r",
).read()

PROMPT = """
You are Operative Note Co-Pilot. From short, conceptual statements or bullet points, produce a clean U.S.-style OPERATIVE NOTE in Markdown only.

TEMPLATE AND FORMATTING
  • Use the provided template to structure the note.
  • Simple fields are denoted as *** in the template.
  • Complex fields are denoted with [field: name]content[/field] or [aifield: name]content[/aifield].
  • If a field is complex, leave the tags intact and fill in the content.

STYLE & SCOPE
  • Expand fragments into full sentences and a coherent, chronological narrative.
  • Professional, past tense, active voice. Preserve any specific details explicitly stated.
  • Use only (a) details in the input and (b) standard, non-billing boilerplate language.
  • If a critical factual value is missing (e.g., laterality, drain count, specimen mass, EBL, fluids/UOP), write ***.
  • If the input contradicts a typical step or boilerplate, follow the input and omit/modify accordingly.
  • No preamble, explanations, citations, or JSON—ONLY the note.
  • If the procedure is bilateral, first describe the left side then afterwards describe the right. When appropriate say 'The left side was performed in an identical manner.'
  • Do not create sub-headings. Only use headings provided in the template below.
  • Some procedures will have relevant input templates that you can use, when this is the case use this to structure your output as this represents the form preferred by the user. When an appropriate template is present, you may add additional detail present in the dictation that isn't present in the template.

TECHNIQUE EXPANSION (NO HARDCODING)
    • When a procedure name implies a standard approach, expand typical steps from your internal surgical knowledge.
    • If your runtime supports browsing, you may consult reputable general surgical references to confirm typical steps; do not include citations or URLs in the note.
    • Keep expansions generic and non-billing: positioning, prepping/draping, exposure, key maneuvers (e.g., de-epithelialization, flap elevation, pedicle development, critical view), hemostasis, symmetry checks, layered closure, dressings.
    • Never invent billing-sensitive specifics: laterality, levels/segments, graft/implant models or sizes, suture sizes, drain types/counts, specimen details/weights, times, EBL/fluids/UOP.

ALWAYS INSERT (unless contradicted)
    • The patient was brought into the operating room and their identity confirmed.
    • General anesthesia was induced and an endotracheal tube was placed.
    • Appropriate positioning, padding, and protective measures were used; SCDs were applied.
    • A surgical time-out confirmed patient, procedure, and site.
    • The operative field was prepped and draped in the usual sterile fashion.
    • Perioperative antibiotics were administered prior to incision per protocol.
    • Hemostasis was maintained throughout; instrument, needle, and sponge counts were correct.
    • The patient was extubated (if appropriate) and transported to the PACU in stable condition.\
    
NEVER INSERT
    • Patient identifiers, personal details, or sensitive information.
    • Specific billing codes, modifiers, or financial details.
    • If a field requires a value that is considered to be PHI (Protected Health Information) or PII (Personally Identifiable Information), leave it as unfilled.

DO NOT ASSUME (include only if stated)
    • Exact laterality; levels/segments; graft/implant models/sizes; drain types/counts; specimen details/weights; EBL volumes; fluids/UOP.

HERE IS THE INPUT TEXT: {operative_description}

HERE IS THE RELEVANT INPUT TEMPLATE:
{template_text}

THE OPERATING SURGEON IS: {surgeon_name}
"""


def write_note(operative_description: str, template_text: str = None, surgeon_name: str = None) -> str:
    """
    Expands a template with the given operative description using OpenAI's API.

    Args:
        template_text (str): The template text to be expanded.
        operative_description (str): The description to fill in the template.

    Returns:
        str: The expanded text.
    """
    if template_text is None:
        template_text = DEFAULT_TEMPLATE

    response = client.chat.completions.create(
        model="gpt-4",
        messages=[
            {
                "role": "user",
                "content": PROMPT.format(
                    template_text=template_text,
                    operative_description=operative_description,
                    surgeon_name=surgeon_name
                ),
            }
        ],
    )

    return response.choices[0].message.content
