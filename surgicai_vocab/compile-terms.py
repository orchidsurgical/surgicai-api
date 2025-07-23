#! /usr/bin/env python
# -*- coding: utf-8 -*-
# surgicai-api/surgicai_vocab/compile-terms.py

import os
import csv
import re
from collections import Counter

sources_dir = os.path.dirname(os.path.abspath(__file__))
output_file = os.path.join(sources_dir, "surgical_terms.txt")


def cpt_codes(word_counter, exclude_words):
    input_path = os.path.join(sources_dir, "sources/cpt_codes.csv")
    with open(input_path, newline="", encoding="utf-8") as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            text = row.get("common language description", "")
            # Extract words, ignore punctuation, make lowercase
            words = re.findall(r"\b\w+\b", text.lower())
            words = [word for word in words if word not in exclude_words]
            word_counter.update(words)
    print("Loaded CPT code words:", len(word_counter))
    return word_counter


def load_exclude_list():
    exclude_path = os.path.join(sources_dir, "sources/exclude.csv")
    exclude_words = set()
    if os.path.exists(exclude_path):
        with open(exclude_path, "r", encoding="utf-8") as f:
            for line in f:
                word = line.strip().lower()
                if word:
                    exclude_words.add(word)
    print("Loaded exclude words:", len(exclude_words))
    return exclude_words


if __name__ == "__main__":
    word_counter = Counter()
    exclude_words = load_exclude_list()
    cpt_codes(word_counter, exclude_words)
    # Write vocab words to output tab-aligned table (Phrase\tDisplayAs), skip numbers, max 50KB
    max_bytes = 51200
    header = "Phrase\tDisplayAs\n"
    with open(output_file, "w", encoding="utf-8") as f:
        f.write(header)
        current_size = len(header.encode("utf-8"))
        for word, _ in word_counter.most_common():
            # Exclude words that are digits or contain any digit
            if not any(char.isdigit() for char in word):
                line = f"{word}\t\n"
                line_bytes = len(line.encode("utf-8"))
                if current_size + line_bytes > max_bytes:
                    break
                f.write(line)
                current_size += line_bytes
