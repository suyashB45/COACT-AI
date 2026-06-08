from typing import TypedDict
from langgraph.graph import StateGraph, START, END
from cli_report import llm_reply

# Define the state for the graph
class AgentState(TypedDict):
    messages: list
    turn_count: int
    mode: str
    session_id: str
    raw_response: str
    token_usage: dict

# Define the single node for now (which sets up the architecture for multi-node tools later)
def chat_node(state: AgentState):
    messages = state["messages"]
    turn_count = state.get("turn_count", 0)
    session_id = state.get("session_id", "unknown")
    mode = state.get("mode", "coaching")
    
    # We call llm_reply which handles retries and token counting just like before
    raw_response, token_usage = llm_reply(
        messages, 
        max_tokens=300, 
        max_retries=3, 
        delay=1, 
        return_usage=True,
        run_name=f"chat_turn_{turn_count}",
        run_tags=["chat", f"session:{session_id}", f"turn:{turn_count}", mode],
        use_chat_model=True
    )
    
    return {
        "raw_response": raw_response,
        "token_usage": token_usage
    }

# Build the Graph
builder = StateGraph(AgentState)  # type: ignore
builder.add_node("chat_model", chat_node)
builder.add_edge(START, "chat_model")
builder.add_edge("chat_model", END)

# Compile into a runnable application
app_graph = builder.compile()
