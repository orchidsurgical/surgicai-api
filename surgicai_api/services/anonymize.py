from presidio_analyzer import AnalyzerEngine
from presidio_anonymizer import AnonymizerEngine

analyzer = AnalyzerEngine()
anonymizer = AnonymizerEngine()


def anonymize_text(text: str, language: str = "en") -> tuple:
    """
    Anonymizes the given text using Presidio's Analyzer and Anonymizer.

    Args:
        text (str): The text to be anonymized.
        language (str): The language of the text (default is "en").

    Returns:
        tuple: A tuple containing the anonymized text and the replacement map.
    """
    # Step 1: Analyze PHI entities, excluding URLs
    analysis_results = analyzer.analyze(
        text=text,
        language=language,
        entities=None,  # None means all entities, but we'll filter below
    )

    # Filter out URL entities
    filtered_results = [r for r in analysis_results if r.entity_type != "URL"]

    # Step 2: Create a replacement map for anonymization
    replacement_map = {}
    for result in filtered_results:
        original_value = text[result.start : result.end]
        placeholder = f"<{result.entity_type}>"
        replacement_map.setdefault(placeholder, []).append(original_value)

    # Step 3: Anonymize (using filtered results)
    anonymized_result = anonymizer.anonymize(
        text=text, analyzer_results=filtered_results
    )

    # Return the anonymized text and the replacement map
    return anonymized_result.text, replacement_map


def reidentify_text(text: str, replacement_map: dict) -> str:
    """
    Re-identifies the original text from the anonymized text.

    Args:
        text (str): The anonymized text.
        replacement_map (dict): The map of placeholders to original values.

    Returns:
        str: The original text with placeholders replaced by their original values.
    """
    for placeholder, originals in replacement_map.items():
        for original in originals:
            text = text.replace(placeholder, original, 1)
    return text
