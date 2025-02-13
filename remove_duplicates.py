import json

def remove_duplicates():
    try:
        # Read questions.json
        with open('questions.json', 'r', encoding='utf-8') as f1:
            main_data = json.load(f1)

        # Read final_set.json
        with open('final_set.json', 'r', encoding='utf-8') as f2:
            final_set_data = json.load(f2)

        # Create a set of questions from final_set.json for faster lookup
        final_set_questions = {q['question'] for q in final_set_data['questions']}

        # Keep only questions that are not in final_set.json
        filtered_questions = [
            q for q in main_data['questions']
            if q['question'] not in final_set_questions
        ]

        # Create the filtered data structure
        filtered_data = {
            'questions': filtered_questions
        }

        # Write the filtered data back to questions.json
        with open('questions.json', 'w', encoding='utf-8') as outfile:
            json.dump(filtered_data, outfile, indent=2, ensure_ascii=False)

        # Print statistics
        print("Duplicate removal completed successfully!")
        print(f"Original question count: {len(main_data['questions'])}")
        print(f"Questions in final_set: {len(final_set_data['questions'])}")
        print(f"Questions after removal: {len(filtered_questions)}")
        print(f"Removed {len(main_data['questions']) - len(filtered_questions)} duplicate questions")

    except FileNotFoundError as e:
        print(f"Error: Could not find one of the input files. {e}")
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON format in one of the input files. {e}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")

if __name__ == "__main__":
    remove_duplicates() 