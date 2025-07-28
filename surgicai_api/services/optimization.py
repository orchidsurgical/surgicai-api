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
            "question": "Did you use a microscope?",
            "potential_answers": ["Yes", "No"],
        },
        {
            "question": "Was the patient under general anesthesia?",
            "potential_answers": ["Yes", "No"],
        },
    ]

    return questions
