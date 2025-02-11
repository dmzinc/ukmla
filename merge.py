import json

def merge_json_files():
    # Read the first JSON file
    with open('question.json', 'r', encoding='utf-8') as f1:
        data1 = json.load(f1)

    # Read the second JSON file
    with open('final_set.json', 'r', encoding='utf-8') as f2:
        data2 = json.load(f2)

    # Merge the questions arrays
    merged_questions = data1['questions'] + data2['questions']

    # Create the merged data structure
    merged_data = {
        'questions': merged_questions
    }

    # Write the merged data to a new file
    with open('questions.json', 'w', encoding='utf-8') as outfile:
        json.dump(merged_data, outfile, indent=2, ensure_ascii=False)

    # Print some statistics
    print(f"Merged successfully!")
    print(f"Total questions: {len(merged_questions)}")
    print(f"Questions from question.json: {len(data1['questions'])}")
    print(f"Questions from final_set.json: {len(data2['questions'])}")

if __name__ == "__main__":
    try:
        merge_json_files()
    except FileNotFoundError as e:
        print(f"Error: Could not find one of the input files. {e}")
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON format in one of the input files. {e}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}") 