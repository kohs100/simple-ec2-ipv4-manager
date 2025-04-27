addEventListener("load", async () => {
  const btn_acq = document.getElementById("btn-acq");
  const btn_rel = document.getElementById("btn-rel");
  const btn_desc = document.getElementById("btn-desc");
  const txt_output = document.getElementById("txt-output");

  const build_trigger = (endpoint) => {
    return async (e) => {
      txt_output.value = "Processing...";

      const resp = await fetch(`/app/${endpoint}`, { method: "POST" });
      const body = await resp.text();
      txt_output.value = `STATUS: ${resp.status}\n${body}`;
    };
  };

  btn_acq.addEventListener("click", build_trigger("acquire"));
  btn_rel.addEventListener("click", build_trigger("release"));

  const trigger_desc = build_trigger("describe");
  btn_desc.addEventListener("click", trigger_desc);

  console.log(await trigger_desc());
});
