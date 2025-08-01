import re

from surgicai_api.models.opnote import OpNote


def get_optimization_questions(op_note: OpNote) -> list:
    """
    Return a list of optimization questions based on the op notes text. It should
    take the shape:

    ```
    [
        {
            "question": "Did you use a microscope?",
            "potential_answers": [
                "Yes",
                "No",
            ]
        }
    ]
    ```

    :param op_note: OpNote instance
    """
    if not op_note.text:
        return []

    # TODO: Placeholder for actual logic to extract questions from the op note text.
    questions = [
        {
            "question": "Was the procedure limited to the ascending aorta, or did it include the hemiarch or total arch?",
            "potential_answers": [
                "Ascending aorta only",
                "Ascending + hemiarch replacement",
                "Total arch replacement",
                "Arch not addressed",
            ],
        },
        {
            "question": "Did the procedure involve circulatory arrest with cerebral protection?",
            "potential_answers": [
                "Yes, with retrograde cerebral perfusion",
                "Yes, with antegrade cerebral perfusion",
                "Yes, without cerebral perfusion",
                "No circulatory arrest used",
            ],
        },
    ]

    return questions


def get_optimization_suggestions(op_note: OpNote) -> list:
    """
    Return a list of optimization suggestions based on the op notes text. It should
    take the shape:

    ```
    [
        {
            "current_text": "portion to be replaced",
            "suggested_text": "replacement text",
            "justification": "reason for change",
            "text_position": {"start": 0, "end": 10},
        }
    ]
    ```

    :param op_note: OpNote instance
    """
    if not op_note.text:
        return []

    # TODO: Placeholder for actual logic to extract suggestions from the op note text.
    suggestions = [
        {
            "current_text": "Ascending aortic replacement with 28 hemashield dacron graft with sidearm under circulatory arrest",
            "suggested_text": "Ascending and hemiarch aortic replacement with 28 Hemashield Dacron graft with sidearm under circulatory arrest (no cerebral perfusion used)",
            "justification": "Clarifies that the hemiarch was included in the replacement and specifies that circulatory arrest was performed without cerebral perfusion, which addresses both questions directly.",
            "text_position": {"start": 118, "end": 200},
        },
        {
            "current_text": "We removed the cross clamp and removed the aorta to the innominate. The aorta had a normal caliber at this point.",
            "suggested_text": "We removed the cross clamp and excised the aorta up to and including the proximal hemiarch, ending just beyond the innominate artery. The aorta had a normal caliber at this point.",
            "justification": "Specifies that the excision extended into the hemiarch up to the innominate, confirming the extent of replacement.",
            "text_position": {"start": 1775, "end": 1850},
        },
        {
            "current_text": "This took 20 minutes of circulatory arrest.",
            "suggested_text": "This took 20 minutes of circulatory arrest without the use of cerebral perfusion.",
            "justification": "Makes it explicit that no antegrade or retrograde cerebral perfusion was used during circulatory arrest, which clarifies the second question.",
            "text_position": {"start": 1885, "end": 1920},
        },
    ]

    return suggestions


def apply_optimization_suggestions_to_text(text: str, suggestions: list) -> OpNote:
    """
    Apply optimization suggestions to the op note text.

    :param op_note: OpNote instance
    :param suggestions: List of suggestions to apply
    :return: Updated OpNote instance with applied suggestions
    """
    # To avoid messing up positions, process suggestions in reverse order of start index
    accepted_suggestions = [
        s for s in suggestions if s.get("accepted", False) and "text_position" in s
    ]
    # Sort by start position descending
    accepted_suggestions.sort(key=lambda s: s["text_position"]["start"], reverse=True)

    for suggestion in accepted_suggestions:
        pos = suggestion["text_position"]
        suggested_text = suggestion["suggested_text"]
        existing_text = suggestion["current_text"]

        text = text.replace(existing_text, suggested_text, 1)

    return text


def generate_postop_diagnosis(text: str, should_insert: bool = False) -> str:
    """
    Generate a postoperative diagnosis based on the operative note text.

    :param text: Operative note text
    :return: Postoperative diagnosis string
    """
    # TODO: Implement logic to generate postoperative diagnosis from the operative note text.
    postop_text = "Ascending and proximal hemiarch aortic dissection, status post ascending and hemiarch aortic replacement with 28mm Hemashield Dacron graft under circulatory arrest without cerebral perfusion."

    if should_insert:
        # Regex to match [aifield: Postoperative Diagnosis]...[/aifield] (including any content between)
        pattern = r"\[aifield: Postoperative Diagnosis\][\s\S]*?\[/aifield\]"
        if not re.search(pattern, text):
            text += f"\n\nPOSTOPERATIVE DIAGNOSIS: [aifield: Postoperative Diagnosis][/aifield]"

        # Replace any existing [aifield: Postoperative Diagnosis]...[/aifield] with the new content
        text = re.sub(
            pattern, f"[aifield: Postoperative Diagnosis]{postop_text}[/aifield]", text
        )
        return text

    return postop_text


def generate_procedures(text: str, should_insert: bool = False) -> str:
    """
    Generate a list of procedures based on the operative note text.

    :param text: Operative note text
    :return: Procedures string
    """
    procedures = [
        "Ascending aortic replacement with 28 hemashield dacron graft with sidearm under circulatory arrest",
        "Independent interpretation of TEE",
        "Bilateral Pleural Chest Tubes",
        "Internal Rigid Fixation with Biomet 360 system",
    ]
    procedure_text = ""
    for index, procedure in enumerate(procedures):
        procedure_text += f"\n  {index+1}. {procedure}"

    if should_insert:
        # Regex to match [aifield: Procedures]...[/aifield] (including any content between)
        pattern = r"\[aifield: Procedures\][\s\S]*?\[/aifield\]"
        if not re.search(pattern, text):
            text += f"\n\nPROCEDURES: [aifield: Procedures][/aifield]"

        # Replace any existing [aifield: Procedures]...[/aifield] with the new content
        text = re.sub(pattern, f"[aifield: Procedures]{procedure_text}[/aifield]", text)
        return text

    return procedures
