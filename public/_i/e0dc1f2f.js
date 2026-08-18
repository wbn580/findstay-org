window.fsOpenWizard = function () { var m = document.getElementById("fswModal"); if (m) { m.classList.add("open"); m.setAttribute("aria-hidden", "false"); } };
      window.fsCloseWizard = function () { var m = document.getElementById("fswModal"); if (m) { m.classList.remove("open"); m.setAttribute("aria-hidden", "true"); } };
      (function () {
        var l = document.getElementById("navLang");
        if (l && !l.dataset.b) {
          l.dataset.b = "1";
          var btn = l.querySelector(".nav-lang-btn");
          if (btn) btn.addEventListener("click", function (e) {
            e.stopPropagation();
            var open = l.classList.toggle("open");
            btn.setAttribute("aria-expanded", open ? "true" : "false");
          });
          document.addEventListener("click", function () {
            l.classList.remove("open");
            if (btn) btn.setAttribute("aria-expanded", "false");
          });
        }
        document.addEventListener("keydown", function (e) { if (e.key === "Escape" && window.fsCloseWizard) window.fsCloseWizard(); });
      })();
