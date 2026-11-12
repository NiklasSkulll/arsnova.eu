# shellcheck shell=bash
# Größenregel für die 1B-Labor-VMs (ADR 1B-010), zum Einbinden per `source`.
# Testfälle: groessen-faelle.json; Tests: groessen.test.mjs. Gleiche Regel in groessen.ps1.

# groessen_empfehlung KERNE THREADS RAM_GIB [KERN_JE_CPU_CSV]
# Gibt JSON aus: {"abbruch":…,"llm":{vcpu,ramGib,cpuset},"app":{…},"warnungen":[…]}.
# KERN_JE_CPU_CSV: Kern-ID je logischer CPU, Index = CPU-Nummer (lscpu -p=CPU,CORE,SOCKET).
groessen_empfehlung() {
  local kerne=$1 threads=$2 ram=$3 topo=${4:-}
  local llm_ram app_ram llm_cpu app_cpu=2 smt=0
  local -a warn=()
  ((threads > kerne)) && smt=1

  if ((ram - 4 >= 18)); then
    llm_ram=12 app_ram=6
  elif ((ram - 4 >= 16)); then
    llm_ram=12 app_ram=4
  elif ((ram - 4 >= 14)); then
    llm_ram=10 app_ram=4
  elif ((ram - 2 >= 14)); then
    llm_ram=10 app_ram=4
  else
    printf '{"abbruch":"ram-zu-klein"}\n'
    return 0
  fi

  if ((smt)); then llm_cpu=$kerne; else llm_cpu=$((kerne - 2)); fi
  ((llm_cpu > 8)) && llm_cpu=8
  if ((llm_cpu < 2)); then
    printf '{"abbruch":"kerne-zu-wenig"}\n'
    return 0
  fi

  ((llm_cpu < 4)) && warn+=(llm-unter-4)
  ((app_ram < 6)) && warn+=(app-ram-4)
  ((llm_ram < 12)) && warn+=(llm-ram-10)
  ((ram - llm_ram - app_ram < 4)) && warn+=(host-ram-2)

  local llm_set=null app_set=null
  if [[ -n "$topo" ]]; then
    local -a kern_von=() erster=() zweiter=()
    IFS=, read -r -a kern_von <<<"$topo"
    # Erster und zweiter Thread je Kern, Kerne in Reihenfolge ihres ersten Auftretens.
    local -a reihe=()
    local cpu k
    for cpu in "${!kern_von[@]}"; do
      k=${kern_von[$cpu]}
      if [[ -z "${erster[$k]:-}" ]]; then
        erster[k]=$cpu
        reihe+=("$k")
      elif [[ -z "${zweiter[$k]:-}" ]]; then
        zweiter[k]=$cpu
      fi
    done
    local -a l=() a=()
    local i
    for ((i = 0; i < llm_cpu; i++)); do l+=("${erster[${reihe[$i]}]}"); done
    for ((i = 0; i < app_cpu; i++)); do
      if ((smt)); then
        a+=("${zweiter[${reihe[$i]}]}")
      else
        a+=("${erster[${reihe[$((llm_cpu + i))]}]}")
      fi
    done
    llm_set="\"$(IFS=,; echo "${l[*]}")\""
    app_set="\"$(IFS=,; echo "${a[*]}")\""
  fi

  local w=""
  ((${#warn[@]})) && w="$(printf '"%s",' "${warn[@]}")" && w=${w%,}
  printf '{"abbruch":null,"llm":{"vcpu":%d,"ramGib":%d,"cpuset":%s},"app":{"vcpu":%d,"ramGib":%d,"cpuset":%s},"warnungen":[%s]}\n' \
    "$llm_cpu" "$llm_ram" "$llm_set" "$app_cpu" "$app_ram" "$app_set" "$w"
}

# groessen_rechner: liest Kerne, Threads, RAM (GiB, abgerundet) und Kern-ID je CPU dieses
# Linux-Rechners und gibt sie als vier Zeilen aus. Kern-ID ist eindeutig über Sockel hinweg.
groessen_rechner() {
  local -a ids=()
  local cpu core sock
  local -A nummer=()
  while IFS=, read -r cpu core sock; do
    [[ "$cpu" == \#* ]] && continue
    [[ -n "${nummer[$sock:$core]:-}" ]] || nummer[$sock:$core]=${#nummer[@]}
    ids[cpu]=${nummer[$sock:$core]}
  done < <(lscpu -p=CPU,CORE,SOCKET)
  echo "${#nummer[@]}"
  echo "${#ids[@]}"
  echo $(($(awk '/^MemTotal:/ {print $2}' /proc/meminfo) / 1024 / 1024))
  (IFS=,; echo "${ids[*]}")
}
