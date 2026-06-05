from sentence_transformers import SentenceTransformer, util

model = SentenceTransformer('all-MiniLM-L6-v2')


def evaluate_answer(answer, ideal_answer):
    emb1 = model.encode(answer, convert_to_tensor=True)
    emb2 = model.encode(ideal_answer, convert_to_tensor=True)

    similarity = util.pytorch_cos_sim(emb1, emb2)
    score = round(float(similarity[0][0]) * 100, 2)
    feedback = "Good answer structure"

    if score < 50:
        feedback = "Try improving technical depth"

    return {
        "score": score,
        "feedback": feedback
    }