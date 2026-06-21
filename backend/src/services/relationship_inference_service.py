import json
from typing import Any
from src.services.schema_service import SchemaService
from src.services.llm_service import LLMService

class RelationshipInferenceService:
    def __init__(self, schema_service: SchemaService, llm_service: LLMService):
        """
        Initialize the service with SchemaService and LLMService.
        """
        self.schema_service = schema_service
        self.llm_service = llm_service

    async def get_augmented_schema(self, catalog: str) -> dict[str, Any]:
        """
        Fetches the full schema for a catalog and augments it with LLM-inferred relationships.
        """
        # 1. Get existing schema with physical foreign keys and samples
        schema = await self.schema_service.get_full_schema(catalog)
        
        # 2. Prepare the schema for the LLM. Samples are included to help with inference.
        llm_input = self._prepare_llm_input(schema)
        
        # 3. Call LLM to infer relationships
        inference_result = self.llm_service.infer_relationships(json.dumps(llm_input, ensure_ascii=False))
        
        if "relationships" in inference_result:
            inferred_rels = inference_result["relationships"]
            # 4. Merge inferred relationships
            existing_rels_keys = {
                (rel["from_table"], rel["from_column"], rel["to_table"], rel["to_column"])
                for rel in schema.get("relationships", [])
            }
            
            for rel in inferred_rels:
                # Validate and format the inferred relationship
                from_table = rel.get("from_table")
                from_column = rel.get("from_column")
                to_table = rel.get("to_table")
                to_column = rel.get("to_column")
                
                if not (from_table and from_column and to_table and to_column):
                    # Handle cases where LLM might use different field names
                    from_table = rel.get("from")
                    to_table = rel.get("to")
                    # If still not found, skip
                    if not (from_table and to_table):
                        continue

                formatted_rel = {
                    "from_table": from_table,
                    "from_column": from_column,
                    "to_table": to_table,
                    "to_column": to_column,
                    "type": rel.get("type", "many_to_one"),
                    "confidence": rel.get("confidence", 0.5),
                    "source": "inferred"
                }
                
                rel_key = (
                    formatted_rel["from_table"], 
                    formatted_rel["from_column"], 
                    formatted_rel["to_table"], 
                    formatted_rel["to_column"]
                )
                
                if rel_key not in existing_rels_keys:
                    schema["relationships"].append(formatted_rel)
                    existing_rels_keys.add(rel_key)
                    
        return schema

    def _prepare_llm_input(self, schema: dict[str, Any]) -> dict[str, Any]:
        """
        Creates a representation of the schema for LLM processing.
        Includes samples as they are vital for relationship inference.
        """
        input_data = {
            "catalog": schema["catalog"],
            "schemas": []
        }
        
        for s in schema["schemas"]:
            input_s = {
                "name": s["name"],
                "tables": []
            }
            for t in s["tables"]:
                input_t = {
                    "name": t["name"],
                    "columns": [
                        {
                            "name": c["name"], 
                            "type": c["type"],
                            "samples": c.get("samples", [])
                        } 
                        for c in t["columns"]
                    ]
                }
                input_s["tables"].append(input_t)
            input_data["schemas"].append(input_s)
            
        input_data["relationships"] = schema.get("relationships", [])
        
        return input_data
