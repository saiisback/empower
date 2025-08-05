
"""
model.py
Advanced SLM model class for generating text for specially abled kids.
Includes modular utilities, logging, error handling, configuration, and extensible architecture.
This version is significantly expanded to include more features for a production-like environment.
"""

import os
import sys
import logging
import json
from typing import Optional, Dict, Any, List, Tuple, Union
import torch
from torch import nn
from torch.utils.data import Dataset
from transformers import (
    AutoTokenizer, AutoModelForCausalLM, PreTrainedTokenizer, PreTrainedModel,
    Trainer, TrainingArguments, pipeline, BitsAndBytesConfig,
    DataCollatorForLanguageModeling
)
# For evaluation
# from datasets import load_metric

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(name)s %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        # logging.FileHandler("slm_model.log") # Optionally log to a file
    ]
)
logger = logging.getLogger("SLMModel")

class ModelConfig:
    """
    Configuration for SLM model.
    This class holds all the hyperparameters and settings for the model, tokenizer, and generation.
    """
    def __init__(self,
                 model_name: str = "distilgpt2",
                 max_length: int = 128,
                 device: Optional[str] = None,
                 quantization: Optional[str] = None, # e.g., "4bit"
                 gradient_checkpointing: bool = False,
                 from_local: bool = False,
                 **kwargs):
        self.model_name = model_name
        self.max_length = max_length
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        self.quantization = quantization
        self.gradient_checkpointing = gradient_checkpointing
        self.from_local = from_local
        # Store any other passed arguments
        for key, value in kwargs.items():
            setattr(self, key, value)

    @classmethod
    def from_json(cls, path: str):
        """Load configuration from a JSON file."""
        logger.info(f"Loading model config from {path}")
        with open(path, "r") as f:
            cfg = json.load(f)
        return cls(**cfg)

    def to_json(self, path: str):
        """Save configuration to a JSON file."""
        logger.info(f"Saving model config to {path}")
        with open(path, "w") as f:
            json.dump(self.__dict__, f, indent=4)

class SLMModel:
    """
    Advanced SLM model for text generation.
    This class encapsulates the model, tokenizer, and all related functionalities
    like generation, training, evaluation, and persistence.
    """
    def __init__(self, config: Optional[ModelConfig] = None):
        self.config = config or ModelConfig()
        logger.info(f"Initializing SLMModel with config: {self.config.__dict__}")

        self.tokenizer: PreTrainedTokenizer = self._load_tokenizer()
        self.model: PreTrainedModel = self._load_model()

        if self.config.device == "cuda" and not torch.cuda.is_available():
            logger.warning("CUDA is not available, falling back to CPU.")
            self.config.device = "cpu"
            self.model.to(self.config.device)

    def _get_quantization_config(self) -> Optional[BitsAndBytesConfig]:
        """Get quantization config for bitsandbytes."""
        if self.config.quantization == "4bit":
            logger.info("Using 4-bit quantization.")
            return BitsAndBytesConfig(
                load_in_4bit=True,
                bnb_4bit_use_double_quant=True,
                bnb_4bit_quant_type="nf4",
                bnb_4bit_compute_dtype=torch.bfloat16
            )
        if self.config.quantization == "8bit":
            logger.info("Using 8-bit quantization.")
            return BitsAndBytesConfig(load_in_8bit=True)
        return None

    def _load_tokenizer(self) -> PreTrainedTokenizer:
        """Loads the tokenizer for the specified model."""
        logger.info(f"Loading tokenizer: {self.config.model_name}")
        try:
            tokenizer = AutoTokenizer.from_pretrained(self.config.model_name)
            if tokenizer.pad_token is None:
                tokenizer.pad_token = tokenizer.eos_token
            return tokenizer
        except Exception as e:
            logger.error(f"Failed to load tokenizer: {e}")
            raise

    def _load_model(self) -> PreTrainedModel:
        """Loads the model with optional quantization."""
        logger.info(f"Loading model: {self.config.model_name} on {self.config.device}")
        quantization_config = self._get_quantization_config()
        model_kwargs = {}
        if quantization_config:
            model_kwargs["quantization_config"] = quantization_config
        
        if self.config.gradient_checkpointing:
            model_kwargs["use_cache"] = False # Required for gradient checkpointing
        
        try:
            model = AutoModelForCausalLM.from_pretrained(
                self.config.model_name,
                **model_kwargs
            )
            if self.config.gradient_checkpointing:
                model.gradient_checkpointing_enable()

            if not quantization_config:
                 model.to(self.config.device)
            return model
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            raise

    def generate(self,
                 prompt: str,
                 max_length: Optional[int] = None,
                 num_return_sequences: int = 1,
                 temperature: float = 0.7,
                 top_p: float = 0.9,
                 top_k: int = 50,
                 do_sample: bool = True,
                 repetition_penalty: float = 1.2,
                 **kwargs) -> List[str]:
        """
        Generate text from a prompt using various generation strategies.
        """
        max_length = max_length or self.config.max_length
        logger.info(f"Generating text for prompt: '{prompt}' with max_length={max_length}")
        
        inputs = self.tokenizer(prompt, return_tensors="pt")
        # Move inputs to the correct device if model is not quantized
        if not self.model.is_quantized:
            inputs = inputs.to(self.config.device)

        try:
            with torch.no_grad():
                outputs = self.model.generate(
                    **inputs,
                    max_length=max_length,
                    pad_token_id=self.tokenizer.eos_token_id,
                    num_return_sequences=num_return_sequences,
                    temperature=temperature,
                    top_p=top_p,
                    top_k=top_k,
                    do_sample=do_sample,
                    repetition_penalty=repetition_penalty,
                    **kwargs
                )
            results = [self.tokenizer.decode(out, skip_special_tokens=True) for out in outputs]
            logger.info(f"Generated {len(results)} sequences.")
            return results
        except Exception as e:
            logger.error(f"Error during generation: {e}", exc_info=True)
            return ["Error during text generation."]

    def save(self, path: str):
        """Save model, tokenizer, and config to a directory."""
        logger.info(f"Saving model and tokenizer to {path}")
        if not os.path.exists(path):
            os.makedirs(path)
        self.model.save_pretrained(path)
        self.tokenizer.save_pretrained(path)
        self.config.to_json(os.path.join(path, "model_config.json"))

    @classmethod
    def load(cls, path: str):
        """Load model from a directory."""
        logger.info(f"Loading model from {path}")
        config_path = os.path.join(path, "model_config.json")
        if not os.path.exists(config_path):
            raise FileNotFoundError(f"Config file not found at {config_path}")
        
        config = ModelConfig.from_json(config_path)
        config.from_local = True # Ensure we load from the local path
        config.model_name = path # Override model name with path
        
        return cls(config)

    def evaluate(self, prompts: List[str], targets: List[str]) -> Dict[str, Any]:
        """
        Evaluate model on a list of prompts and targets.
        Returns accuracy and other metrics like BLEU and ROUGE.
        """
        logger.info(f"Starting evaluation on {len(prompts)} samples...")
        # bleu = load_metric("bleu")
        # rouge = load_metric("rouge")
        
        results = []
        predictions_for_bleu = []
        targets_for_bleu = []

        for prompt, target in zip(prompts, targets):
            generated = self.generate(prompt, max_length=len(target) + 30)[0]
            match = target.strip().lower() in generated.strip().lower()
            
            # For BLEU/ROUGE
            predictions_for_bleu.append(self.tokenizer.tokenize(generated))
            targets_for_bleu.append([self.tokenizer.tokenize(target)])

            results.append({"prompt": prompt, "target": target, "generated": generated, "match": match})
        
        accuracy = sum(r["match"] for r in results) / len(results) if results else 0
        
        # bleu_score = bleu.compute(predictions=predictions_for_bleu, references=targets_for_bleu)
        # rouge_score = rouge.compute(predictions=[" ".join(p) for p in predictions_for_bleu], 
        #                             references=[" ".join(t[0]) for t in targets_for_bleu])

        logger.info(f"Evaluation accuracy: {accuracy:.4f}")
        # logger.info(f"BLEU score: {bleu_score['bleu']:.4f}")
        # logger.info(f"ROUGE scores: {rouge_score}")

        return {
            "results": results, 
            "accuracy": accuracy,
            # "bleu": bleu_score['bleu'],
            # "rouge": rouge_score
        }

    def get_pipeline(self, task: str = "text-generation"):
        """Get a Hugging Face pipeline for a specified task."""
        logger.info(f"Creating pipeline for task: {task}")
        device_id = 0 if self.config.device == "cuda" else -1
        return pipeline(task, model=self.model, tokenizer=self.tokenizer, device=device_id)

    def print_summary(self):
        """Print a summary of the model and its configuration."""
        summary = (
            f"\n{'='*20} Model Summary {'='*20}\n"
            f"Model Name: {self.config.model_name}\n"
            f"Device: {self.config.device}\n"
            f"Max Length: {self.config.max_length}\n"
            f"Quantization: {self.config.quantization}\n"
            f"Tokenizer Vocab Size: {self.tokenizer.vocab_size}\n"
            f"Model Parameters: {sum(p.numel() for p in self.model.parameters() if p.requires_grad) / 1e6:.2f}M\n"
            f"{'='*55}\n"
        )
        logger.info(summary)

    def update_config(self, **kwargs):
        """Update model config attributes dynamically."""
        logger.info(f"Updating config with: {kwargs}")
        for key, value in kwargs.items():
            if hasattr(self.config, key):
                setattr(self.config, key, value)
            else:
                logger.warning(f"Config has no attribute '{key}', skipping.")
        logger.info(f"New config: {self.config.__dict__}")

    def set_device(self, device: str):
        """Move model to a specified device (e.g., 'cpu', 'cuda:0')."""
        if self.model.is_quantized:
            logger.warning("Cannot move a quantized model to a different device.")
            return
        try:
            self.model.to(device)
            self.config.device = device
            logger.info(f"Model successfully moved to {device}")
        except Exception as e:
            logger.error(f"Failed to move model to {device}: {e}")

# Example usage and test block
if __name__ == "__main__":
    # This block demonstrates how to use the SLMModel class.
    # It's useful for testing and as an example.
    
    # 1. Initialize with a default or custom config
    config = ModelConfig(
        model_name="distilgpt2",
        max_length=70,
        # quantization="4bit" # Uncomment for 4-bit quantization
    )
    
    # 2. Create an instance of the model
    try:
        slm = SLMModel(config)
        slm.print_summary()

        # 3. Generate text
        prompt = "Teach a 7-year-old with a visual disability about colors using textures."
        print(f"\n--- Generating text for prompt: '{prompt}' ---")
        results = slm.generate(prompt, num_return_sequences=2, temperature=0.8)
        for i, res in enumerate(results):
            print(f"Result {i+1}: {res}\n")

        # 4. Save the model
        save_path = "slm_test_save"
        print(f"--- Saving model to '{save_path}' ---")
        slm.save(save_path)

        # 5. Load the model from the saved path
        print(f"--- Loading model from '{save_path}' ---")
        reloaded_slm = SLMModel.load(save_path)
        reloaded_slm.print_summary()
        
        # 6. Test the reloaded model
        print("--- Testing reloaded model ---")
        reload_result = reloaded_slm.generate(prompt)[0]
        print(f"Reloaded model result: {reload_result}\n")

        # 7. Evaluate the model
        print("--- Evaluating model ---")
        eval_prompts = ["What is a cat?", "Describe the sun."]
        eval_targets = ["A cat is a small furry animal.", "The sun is a big star that gives us light."]
        evaluation_metrics = slm.evaluate(eval_prompts, eval_targets)
        print(f"Evaluation results: {json.dumps(evaluation_metrics, indent=2)}")

    except Exception as e:
        logger.error(f"An error occurred in the main execution block: {e}", exc_info=True)

